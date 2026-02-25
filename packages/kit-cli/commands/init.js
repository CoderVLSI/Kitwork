const chalk = require('chalk');
const { initRepo } = require('kit-core');

module.exports = function init() {
    try {
        const kitDir = initRepo();
        console.log(chalk.green('✓') + ` Initialized empty Kitwork repository in ${chalk.bold(kitDir)}`);
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
