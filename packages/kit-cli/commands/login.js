const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const readline = require('readline');
const { getKitDir } = require('kit-core');

/**
 * kit login — Authenticate with Kitwork server.
 * Prompts for username + password, gets a Kit Key token, stores it in .kit/config.
 */
module.exports = async function login() {
    try {
        const kitDir = getKitDir();
        const configPath = path.join(kitDir, 'config');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        // Check if already logged in
        if (config.auth && config.auth.token) {
            console.log(chalk.yellow('⚠'), `Already logged in as ${chalk.bold(config.auth.username)}`);
            console.log(chalk.dim('  Run `kit logout` first to switch accounts.'));
            return;
        }

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

        console.log(chalk.bold.hex('#f97316')('\n🔑 Kitwork Login\n'));

        const username = await ask(chalk.dim('  Username: '));
        const password = await ask(chalk.dim('  Password: '));
        rl.close();

        if (!username || !password) {
            console.error(chalk.red('✗'), 'Username and password are required');
            process.exit(1);
        }

        const convexUrl = config.server || 'https://colorful-ibis-753.convex.site';
        const loginUrl = `${convexUrl}/api/auth/login`;

        console.log(chalk.dim('\n  Authenticating...'));

        const payload = JSON.stringify({ username, password });
        const urlObj = new URL(loginUrl);
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
                    try {
                        const result = JSON.parse(body);

                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            // Store token in config
                            if (!config.auth) config.auth = {};
                            config.auth.token = result.token;
                            config.auth.username = result.username;
                            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

                            console.log(chalk.green('\n  ✓'), `Logged in as ${chalk.bold(result.displayName || result.username)}`);
                            console.log(chalk.dim(`  Kit Key stored in .kit/config`));
                            console.log(chalk.dim('  You can now push and pull with authentication.\n'));
                        } else {
                            console.error(chalk.red('\n  ✗'), result.error || 'Login failed');
                        }
                    } catch {
                        console.error(chalk.red('\n  ✗'), `Server error: ${body}`);
                    }
                });
            }
        );

        req.on('error', (err) => {
            console.error(chalk.red('\n  ✗'), `Connection failed: ${err.message}`);
            console.log(chalk.dim('  Is the Kitwork server running?'));
        });

        req.write(payload);
        req.end();
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
