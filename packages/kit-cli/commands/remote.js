const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getKitDir } = require('kit-core');

/**
 * Add a remote.
 */
function add(name, url) {
    try {
        const kitDir = getKitDir();
        const configPath = path.join(kitDir, 'config');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        if (config.remotes[name]) {
            console.error(chalk.red('✗'), `Remote '${name}' already exists`);
            process.exit(1);
        }

        config.remotes[name] = { url };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

        console.log(chalk.green('✓') + ` Added remote ${chalk.bold(name)}: ${url}`);
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
}

/**
 * List remotes.
 */
function list() {
    try {
        const kitDir = getKitDir();
        const configPath = path.join(kitDir, 'config');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        const names = Object.keys(config.remotes);
        if (names.length === 0) {
            console.log(chalk.dim('No remotes configured.'));
            return;
        }

        for (const name of names) {
            console.log(`${chalk.bold(name)}\t${config.remotes[name].url}`);
        }
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
}

module.exports = { add, list };
