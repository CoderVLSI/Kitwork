const chalk = require('chalk');
const { createCommit } = require('kit-core');

module.exports = function commit(options) {
    try {
        const hash = createCommit(options.message, options.author);
        const short = hash.slice(0, 8);
        console.log(chalk.green('✓') + ` [${chalk.yellow(short)}] ${options.message}`);
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
