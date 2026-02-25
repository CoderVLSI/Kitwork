const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { getKitDir, resolveRef, readObject, walkHistory, readCommit, flattenTree } = require('kit-core');

/**
 * Push objects and refs to a remote Kitwork server.
 * Protocol: POST /api/repos/:user/:repo/push
 * Body: { branch, commitHash, objects: [{ hash, data (base64) }] }
 */
module.exports = function push(remoteName, branchName) {
    try {
        const kitDir = getKitDir();
        const configPath = path.join(kitDir, 'config');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        if (!config.remotes[remoteName]) {
            console.error(chalk.red('✗'), `Remote '${remoteName}' not found`);
            process.exit(1);
        }

        const remoteUrl = config.remotes[remoteName].url;
        const commitHash = resolveRef(branchName, kitDir);

        if (!commitHash) {
            console.error(chalk.red('✗'), `Branch '${branchName}' has no commits`);
            process.exit(1);
        }

        // Collect all objects to push (walk history + all trees + blobs)
        const objectHashes = new Set();
        collectObjects(commitHash, kitDir, objectHashes);

        // Build payload
        const objects = [];
        for (const hash of objectHashes) {
            const objPath = path.join(kitDir, 'objects', hash.slice(0, 2), hash.slice(2));
            const data = fs.readFileSync(objPath).toString('base64');
            objects.push({ hash, data });
        }

        const payload = JSON.stringify({
            branch: branchName,
            commitHash,
            objects,
        });

        const pushUrl = `${remoteUrl}/push`;
        console.log(chalk.dim(`Pushing ${objects.length} objects to ${remoteUrl}...`));

        // Make HTTP request
        const urlObj = new URL(pushUrl);
        const transport = urlObj.protocol === 'https:' ? https : http;

        const req = transport.request(
            {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            (res) => {
                let body = '';
                res.on('data', (chunk) => (body += chunk));
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(chalk.green('✓') + ` Pushed ${chalk.bold(branchName)} → ${remoteName}`);
                    } else {
                        console.error(chalk.red('✗'), `Push failed (${res.statusCode}): ${body}`);
                    }
                });
            }
        );

        req.on('error', (err) => {
            console.error(chalk.red('✗'), `Connection failed: ${err.message}`);
            console.log(chalk.dim('  Is the Kitwork server running?'));
        });

        req.write(payload);
        req.end();
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};

/**
 * Recursively collect all object hashes reachable from a commit.
 */
function collectObjects(commitHash, kitDir, visited) {
    if (visited.has(commitHash)) return;
    visited.add(commitHash);

    const commit = readCommit(commitHash, kitDir);

    // Add tree objects
    collectTreeObjects(commit.tree, kitDir, visited);

    // Walk parent
    if (commit.parent) {
        collectObjects(commit.parent, kitDir, visited);
    }
}

function collectTreeObjects(treeHash, kitDir, visited) {
    if (visited.has(treeHash)) return;
    visited.add(treeHash);

    const { content } = readObject(treeHash, kitDir);
    const lines = content.toString('utf-8').trim().split('\n').filter(Boolean);

    for (const line of lines) {
        const parts = line.split(' ');
        const objType = parts[1];
        const objHash = parts[2];

        visited.add(objHash);
        if (objType === 'tree') {
            collectTreeObjects(objHash, kitDir, visited);
        }
    }
}
