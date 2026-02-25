const chalk = require('chalk');
const { diffWorkingTree } = require('kit-core');

module.exports = function diff() {
    try {
        const diffs = diffWorkingTree();

        if (diffs.length === 0) {
            console.log(chalk.dim('No changes.'));
            return;
        }

        for (const d of diffs) {
            console.log(chalk.bold.white(`--- a/${d.file}`));
            console.log(chalk.bold.white(`+++ b/${d.file}`));
            console.log('');

            if (d.status === 'deleted') {
                console.log(chalk.red('  (file deleted)'));
                continue;
            }

            for (const line of d.diff) {
                if (line.type === '+') {
                    console.log(chalk.green(`+ ${line.line}`));
                } else if (line.type === '-') {
                    console.log(chalk.red(`- ${line.line}`));
                } else {
                    console.log(chalk.dim(`  ${line.line}`));
                }
            }
            console.log('');
        }
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
