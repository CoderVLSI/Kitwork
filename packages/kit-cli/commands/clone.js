const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { initRepo, updateRef, checkoutTree, getKitDir } = require('kit-core');

/**
 * Clone a remote Kitwork repository.
 * Protocol: GET <url>/pull?branch=main
 */
module.exports = function clone(url, directory) {
    try {
        // Determine target directory
        const repoName = url.split('/').filter(Boolean).pop() || 'repo';
        const targetDir = path.resolve(directory || repoName);

        if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
            console.error(chalk.red('✗'), `Directory '${targetDir}' already exists and is not empty`);
            process.exit(1);
        }

        fs.mkdirSync(targetDir, { recursive: true });

        // Initialize repo
        initRepo(targetDir);
        const kitDir = path.join(targetDir, '.kit');

        // Save remote
        const configPath = path.join(kitDir, 'config');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        config.remotes.origin = { url };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

        console.log(chalk.dim(`Cloning from ${url}...`));

        const pullUrl = `${url}/pull?branch=main`;
        const urlObj = new URL(pullUrl);
        const transport = urlObj.protocol === 'https:' ? https : http;

        transport.get(pullUrl, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error(chalk.red('✗'), `Clone failed (${res.statusCode}): ${body}`);
                    return;
                }

                try {
                    const data = JSON.parse(body);

                    // Write objects
                    for (const obj of data.objects) {
                        const dir = path.join(kitDir, 'objects', obj.hash.slice(0, 2));
                        const filePath = path.join(dir, obj.hash.slice(2));
                        if (!fs.existsSync(filePath)) {
                            fs.mkdirSync(dir, { recursive: true });
                            fs.writeFileSync(filePath, Buffer.from(obj.data, 'base64'));
                        }
                    }

                    // Update ref and checkout
                    updateRef('refs/heads/main', data.commitHash, kitDir);
                    checkoutTree(data.commitHash, targetDir, kitDir);

                    console.log(
                        chalk.green('✓') +
                        ` Cloned into ${chalk.bold(targetDir)} (${data.objects.length} objects)`
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
