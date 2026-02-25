const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getKitDir } = require('kit-core');

/**
 * kit config — Get/set configuration values.
 * Usage:
 *   kit config user.name "Your Name"
 *   kit config user.email "you@email.com"
 *   kit config server "https://example.convex.site"
 *   kit config              ← show all config
 */
module.exports = function config(key, value) {
    try {
        const kitDir = getKitDir();
        const configPath = path.join(kitDir, 'config');
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        // Ensure user section exists
        if (!cfg.user) cfg.user = {};

        if (!key) {
            // Show all config
            console.log(chalk.bold('Kitwork Config:\n'));
            if (cfg.user.name) console.log(`  user.name   = ${chalk.cyan(cfg.user.name)}`);
            if (cfg.user.email) console.log(`  user.email  = ${chalk.cyan(cfg.user.email)}`);
            if (cfg.server) console.log(`  server      = ${chalk.cyan(cfg.server)}`);
            if (cfg.remotes && Object.keys(cfg.remotes).length) {
                console.log('\n  ' + chalk.bold('Remotes:'));
                for (const [name, remote] of Object.entries(cfg.remotes)) {
                    console.log(`    ${chalk.yellow(name)} → ${remote.url}`);
                }
            }
            return;
        }

        if (!value) {
            // Get a value
            const val = key.includes('.') ? getNestedValue(cfg, key) : cfg[key];
            if (val !== undefined) {
                console.log(val);
            } else {
                console.log(chalk.dim(`(not set)`));
            }
            return;
        }

        // Set a value
        setNestedValue(cfg, key, value);
        fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
        console.log(chalk.green('✓'), `Set ${chalk.bold(key)} = ${chalk.cyan(value)}`);
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};

function getNestedValue(obj, key) {
    const parts = key.split('.');
    let current = obj;
    for (const p of parts) {
        if (current === undefined) return undefined;
        current = current[p];
    }
    return current;
}

function setNestedValue(obj, key, value) {
    const parts = key.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}
