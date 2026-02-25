const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getKitDir, resolveRef, readCommit, getHead, readIndex, writeIndex, checkoutTree } = require('kit-core');

/**
 * kit reset — Undo commits or unstage files.
 * Usage:
 *   kit reset              ← unstage all files (reset index to HEAD)
 *   kit reset <file>       ← unstage a specific file
 *   kit reset --hard       ← reset working tree + index to HEAD
 *   kit reset --soft HEAD~1 ← move HEAD back one commit (keep changes staged)
 */
module.exports = function reset(target, options) {
    try {
        const kitDir = getKitDir();
        const repoRoot = path.dirname(kitDir);

        if (options.hard) {
            // Hard reset — reset index + working tree to HEAD
            const head = getHead(kitDir);
            const commitHash = resolveRef(head.type === 'branch' ? head.name : head.hash, kitDir);

            if (!commitHash) {
                console.error(chalk.red('✗'), 'No commits to reset to');
                process.exit(1);
            }

            checkoutTree(commitHash, repoRoot, kitDir);
            console.log(chalk.green('✓'), `Hard reset to ${chalk.yellow(commitHash.slice(0, 8))}`);
            return;
        }

        if (options.soft && target) {
            // Soft reset — move HEAD back but keep changes staged
            const match = target.match(/^HEAD~(\d+)$/);
            if (match) {
                const steps = parseInt(match[1]);
                let currentHash = resolveRef('HEAD', kitDir);

                for (let i = 0; i < steps && currentHash; i++) {
                    const commit = readCommit(currentHash, kitDir);
                    currentHash = commit.parent;
                }

                if (!currentHash) {
                    console.error(chalk.red('✗'), 'Cannot go back that far');
                    process.exit(1);
                }

                const head = getHead(kitDir);
                if (head.type === 'branch') {
                    const refPath = path.join(kitDir, 'refs', 'heads', head.name);
                    fs.writeFileSync(refPath, currentHash + '\n', 'utf-8');
                }

                console.log(chalk.green('✓'), `Soft reset to ${chalk.yellow(currentHash.slice(0, 8))}`);
                return;
            }
        }

        // Default: unstage files (reset index)
        if (target) {
            // Unstage specific file
            const index = readIndex(kitDir);
            if (index.entries[target]) {
                delete index.entries[target];
                writeIndex(index, kitDir);
                console.log(chalk.green('✓'), `Unstaged ${chalk.bold(target)}`);
            } else {
                console.log(chalk.yellow('⚠'), `'${target}' is not staged`);
            }
        } else {
            // Unstage all — reset index to empty
            writeIndex({ entries: {} }, kitDir);
            console.log(chalk.green('✓'), 'Unstaged all files');
        }
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
