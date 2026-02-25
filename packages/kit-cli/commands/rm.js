const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getKitDir, readIndex, writeIndex } = require('kit-core');

/**
 * kit rm — Remove files from tracking (and optionally from disk).
 * Usage:
 *   kit rm <file>           ← remove from index and working tree
 *   kit rm --cached <file>  ← remove from index only (keep file on disk)
 */
module.exports = function rm(files, options) {
    try {
        const kitDir = getKitDir();
        const repoRoot = path.dirname(kitDir);
        const index = readIndex(kitDir);

        let removed = 0;
        for (const file of files) {
            const relPath = path.relative(repoRoot, path.resolve(file)).replace(/\\/g, '/');

            if (index.entries[relPath]) {
                delete index.entries[relPath];
                removed++;

                if (!options.cached) {
                    // Also delete from disk
                    const fullPath = path.join(repoRoot, relPath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(chalk.dim(`  deleted ${relPath}`));
                    }
                } else {
                    console.log(chalk.dim(`  untracked ${relPath}`));
                }
            } else {
                console.log(chalk.yellow('⚠'), `'${relPath}' is not tracked`);
            }
        }

        writeIndex(index, kitDir);

        if (removed > 0) {
            console.log(chalk.green('✓'), `Removed ${removed} file(s) from tracking`);
        }
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
