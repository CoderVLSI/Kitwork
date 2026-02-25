const chalk = require('chalk');
const { listBranches, createBranch, getHead } = require('kit-core');

module.exports = function branch(name) {
    try {
        if (name) {
            createBranch(name);
            console.log(chalk.green('✓') + ` Created branch ${chalk.bold(name)}`);
        } else {
            const branches = listBranches();
            const head = getHead();

            if (branches.length === 0) {
                // Show current branch even if no commits
                if (head.type === 'branch') {
                    console.log(chalk.green(`* ${head.name}`) + chalk.dim(' (no commits yet)'));
                }
                return;
            }

            for (const b of branches) {
                if (b.current) {
                    console.log(chalk.green(`* ${b.name}`) + chalk.dim(` ${b.hash.slice(0, 8)}`));
                } else {
                    console.log(`  ${b.name}` + chalk.dim(` ${b.hash.slice(0, 8)}`));
                }
            }
        }
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
