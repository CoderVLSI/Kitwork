const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getKitDir, resolveRef, readCommit, createCommit, readIndex, writeIndex, flattenTree, hashObject, checkoutTree } = require('kit-core');

/**
 * kit revert — Create a new commit that undoes a previous commit.
 * Usage:
 *   kit revert <commit-hash>
 */
module.exports = function revert(commitRef) {
    try {
        const kitDir = getKitDir();
        const repoRoot = path.dirname(kitDir);

        const hash = resolveRef(commitRef, kitDir) || commitRef;
        if (!hash) {
            console.error(chalk.red('✗'), 'Invalid commit reference');
            process.exit(1);
        }

        const commitToRevert = readCommit(hash, kitDir);

        if (!commitToRevert.parent) {
            console.error(chalk.red('✗'), 'Cannot revert the initial commit');
            process.exit(1);
        }

        // Checkout the parent commit's tree (the state before the commit)
        checkoutTree(commitToRevert.parent, repoRoot, kitDir);

        // Re-stage all files from parent tree
        const parentCommit = readCommit(commitToRevert.parent, kitDir);
        const parentFiles = flattenTree(parentCommit.tree, kitDir);

        const index = { entries: {} };
        for (const file of parentFiles) {
            index.entries[file.path] = { hash: file.hash, mode: file.mode };
        }
        writeIndex(index, kitDir);

        // Read config for author
        const configPath = path.join(kitDir, 'config');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const author = (config.user && config.user.name) || 'Kitwork User';

        // Create revert commit
        const revertHash = createCommit(
            `Revert "${commitToRevert.message}"\n\nThis reverts commit ${hash.slice(0, 8)}.`,
            author,
            kitDir
        );

        console.log(chalk.green('✓'), `Created revert commit ${chalk.yellow(revertHash.slice(0, 8))}`);
        console.log(chalk.dim(`  Reverted: ${commitToRevert.message}`));
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
