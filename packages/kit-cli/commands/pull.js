const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { getKitDir, updateRef, getHead, checkoutTree } = require('kit-core');

/**
 * Pull commits from Kitwork (Convex HTTP endpoint).
 */
module.exports = function pull(remoteName, branchName) {
    try {
        const kitDir = getKitDir();
        const repoRoot = path.dirname(kitDir);
        const configPath = path.join(kitDir, 'config');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        if (!config.remotes[remoteName]) {
            console.error(chalk.red('✗'), `Remote '${remoteName}' not found`);
            process.exit(1);
        }

        const remoteUrl = config.remotes[remoteName].url;

        // Parse owner/repo from URL
        const urlParts = remoteUrl.replace(/\/$/, '').split('/').filter(Boolean);
        const repoName = urlParts[urlParts.length - 1];
        const ownerUsername = urlParts[urlParts.length - 2];

        const convexUrl = config.server || 'https://colorful-ibis-753.convex.site';
        const pullUrl = `${convexUrl}/api/pull?owner=${ownerUsername}&repo=${repoName}&branch=${branchName}`;

        console.log(chalk.dim(`Pulling ${ownerUsername}/${repoName} (${branchName})...`));

        const urlObj = new URL(pullUrl);
        const transport = urlObj.protocol === 'https:' ? https : http;

        transport.get(pullUrl, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error(chalk.red('✗'), `Pull failed (${res.statusCode}): ${body}`);
                    return;
                }

                try {
                    const data = JSON.parse(body);

                    // Write objects to local store
                    let newObjects = 0;
                    for (const obj of data.objects) {
                        const dir = path.join(kitDir, 'objects', obj.hash.slice(0, 2));
                        const filePath = path.join(dir, obj.hash.slice(2));
                        if (!fs.existsSync(filePath)) {
                            fs.mkdirSync(dir, { recursive: true });
                            fs.writeFileSync(filePath, Buffer.from(obj.data, 'base64'));
                            newObjects++;
                        }
                    }

                    // Update branch ref
                    updateRef(`refs/heads/${branchName}`, data.commitHash, kitDir);

                    // Checkout if on same branch
                    const head = getHead(kitDir);
                    if (head.type === 'branch' && head.name === branchName) {
                        checkoutTree(data.commitHash, repoRoot, kitDir);
                    }

                    console.log(
                        chalk.green('✓') +
                        ` Pulled ${chalk.bold(newObjects)} new objects, updated ${branchName}`
                    );
                } catch (parseErr) {
                    console.error(chalk.red('✗'), 'Failed to parse response:', parseErr.message);
                }
            });
        }).on('error', (err) => {
            console.error(chalk.red('✗'), `Connection failed: ${err.message}`);
        });
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
