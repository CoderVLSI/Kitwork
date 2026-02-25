const chalk = require('chalk');
const { walkHistory } = require('kit-core');

module.exports = function log(options) {
    try {
        const commits = walkHistory();
        const count = parseInt(options.count, 10) || 10;

        if (commits.length === 0) {
            console.log(chalk.dim('No commits yet.'));
            return;
        }

        const showing = commits.slice(0, count);
        for (const c of showing) {
            const short = c.hash.slice(0, 8);
            const date = c.timestamp
                ? new Date(c.timestamp * 1000).toLocaleString()
                : 'unknown';

            console.log(chalk.yellow(`commit ${c.hash}`));
            console.log(`Author: ${chalk.cyan(c.author || 'unknown')}`);
            console.log(`Date:   ${chalk.dim(date)}`);
            console.log('');
            console.log(`    ${c.message}`);
            console.log('');
        }
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
