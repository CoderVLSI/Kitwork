const chalk = require('chalk');
const { addPaths } = require('kit-core');

module.exports = function add(paths) {
    try {
        const added = addPaths(paths);
        for (const file of added) {
            console.log(chalk.green('  add'), file);
        }
        console.log(chalk.green('✓') + ` Staged ${chalk.bold(added.length)} file(s)`);
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
