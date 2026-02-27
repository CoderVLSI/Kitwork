const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getKitDir } = require('kit-core');

/**
 * kit logout — Remove stored Kit Key and auth info.
 */
module.exports = function logout() {
    try {
        const kitDir = getKitDir();
        const configPath = path.join(kitDir, 'config');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        if (!config.auth || !config.auth.token) {
            console.log(chalk.yellow('⚠'), 'Not currently logged in.');
            return;
        }

        const username = config.auth.username || 'unknown';
        delete config.auth;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

        console.log(chalk.green('✓'), `Logged out from ${chalk.bold(username)}`);
        console.log(chalk.dim('  Kit Key removed from .kit/config'));
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
