const chalk = require('chalk');
const { merge } = require('kit-core');

module.exports = function mergeCmd(branchName) {
    try {
        const result = merge(branchName);

        if (result.type === 'conflict') {
            console.log(chalk.yellow('⚠'), result.message);
        } else {
            console.log(chalk.green('✓'), result.message);
        }
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
