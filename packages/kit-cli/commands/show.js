const chalk = require('chalk');
const { getKitDir, resolveRef, readCommit, readObject, flattenTree } = require('kit-core');

/**
 * kit show — Show details of a commit.
 * Usage:
 *   kit show           ← show HEAD commit
 *   kit show <hash>    ← show a specific commit
 */
module.exports = function show(commitRef) {
    try {
        const kitDir = getKitDir();
        const hash = commitRef
            ? resolveRef(commitRef, kitDir) || commitRef
            : resolveRef('HEAD', kitDir);

        if (!hash) {
            console.error(chalk.red('✗'), 'No commits found');
            process.exit(1);
        }

        const commit = readCommit(hash, kitDir);

        console.log(chalk.yellow('commit ') + chalk.yellow.bold(hash));
        console.log(chalk.bold('Author:  ') + commit.author);
        console.log(chalk.bold('Date:    ') + new Date(commit.timestamp * 1000).toLocaleString());
        console.log(chalk.bold('Tree:    ') + chalk.dim(commit.tree));
        if (commit.parent) {
            console.log(chalk.bold('Parent:  ') + chalk.dim(commit.parent));
        }
        console.log('');
        console.log('    ' + commit.message);
        console.log('');

        // Show files in this commit's tree
        try {
            const files = flattenTree(commit.tree, kitDir);
            console.log(chalk.bold(`Files (${files.length}):`));
            for (const file of files.sort((a, b) => a.path.localeCompare(b.path))) {
                console.log(`  ${chalk.dim('•')} ${file.path}`);
            }
        } catch {
            // flattenTree might not be available
        }
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
