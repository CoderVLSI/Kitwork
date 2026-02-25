const chalk = require('chalk');
const { getStatus } = require('kit-core');

module.exports = function status() {
    try {
        const { staged, modified, untracked } = getStatus();

        if (staged.length === 0 && modified.length === 0 && untracked.length === 0) {
            console.log(chalk.green('✓') + ' Working tree clean');
            return;
        }

        if (staged.length > 0) {
            console.log(chalk.green.bold('Changes to be committed:'));
            for (const s of staged) {
                console.log(chalk.green(`  ${s}`));
            }
            console.log('');
        }

        if (modified.length > 0) {
            console.log(chalk.red.bold('Changes not staged for commit:'));
            for (const m of modified) {
                console.log(chalk.red(`  modified: ${m}`));
            }
            console.log('');
        }

        if (untracked.length > 0) {
            console.log(chalk.dim.bold('Untracked files:'));
            for (const u of untracked) {
                console.log(chalk.dim(`  ${u}`));
            }
            console.log('');
        }
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
