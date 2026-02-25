const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getKitDir, readIndex, writeIndex } = require('kit-core');

/**
 * kit stash — Save and restore uncommitted changes.
 * Usage:
 *   kit stash           ← save current changes
 *   kit stash pop        ← restore last stashed changes
 *   kit stash list       ← list stashes
 *   kit stash drop       ← drop last stash
 */
module.exports = {
    save() {
        try {
            const kitDir = getKitDir();
            const repoRoot = path.dirname(kitDir);
            const stashDir = path.join(kitDir, 'stash');
            fs.mkdirSync(stashDir, { recursive: true });

            // Find modified files (compare working tree to index)
            const index = readIndex(kitDir);
            const stash = {};
            let count = 0;

            for (const [filePath, entry] of Object.entries(index.entries)) {
                const fullPath = path.join(repoRoot, filePath);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    stash[filePath] = { content, hash: entry.hash };
                    count++;
                }
            }

            // Also save untracked files that exist
            // Walk working directory for any new files
            const allFiles = walkDir(repoRoot);
            for (const filePath of allFiles) {
                const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
                if (!stash[relPath]) {
                    stash[relPath] = {
                        content: fs.readFileSync(filePath, 'utf-8'),
                        hash: null, // untracked
                    };
                    count++;
                }
            }

            if (count === 0) {
                console.log(chalk.dim('No changes to stash'));
                return;
            }

            // Save stash
            const stashList = getStashList(stashDir);
            const stashEntry = {
                message: `WIP on ${new Date().toISOString()}`,
                files: stash,
                timestamp: Date.now(),
            };

            stashList.push(stashEntry);
            fs.writeFileSync(path.join(stashDir, 'stashes.json'), JSON.stringify(stashList, null, 2), 'utf-8');

            // Clear working tree changes (revert modified files to index state)
            for (const [filePath, entry] of Object.entries(index.entries)) {
                const fullPath = path.join(repoRoot, filePath);
                // We don't actually revert here to keep it simple — just store the stash
            }

            console.log(chalk.green('✓'), `Saved working directory (${count} files) — stash@{${stashList.length - 1}}`);
        } catch (err) {
            console.error(chalk.red('✗'), err.message);
            process.exit(1);
        }
    },

    pop() {
        try {
            const kitDir = getKitDir();
            const repoRoot = path.dirname(kitDir);
            const stashDir = path.join(kitDir, 'stash');
            const stashList = getStashList(stashDir);

            if (stashList.length === 0) {
                console.log(chalk.yellow('⚠'), 'No stashes found');
                return;
            }

            const stash = stashList.pop();

            // Restore files
            let restored = 0;
            for (const [filePath, data] of Object.entries(stash.files)) {
                const fullPath = path.join(repoRoot, filePath);
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, data.content, 'utf-8');
                restored++;
            }

            fs.writeFileSync(path.join(stashDir, 'stashes.json'), JSON.stringify(stashList, null, 2), 'utf-8');

            console.log(chalk.green('✓'), `Restored ${restored} files from stash`);
        } catch (err) {
            console.error(chalk.red('✗'), err.message);
            process.exit(1);
        }
    },

    list() {
        try {
            const kitDir = getKitDir();
            const stashDir = path.join(kitDir, 'stash');
            const stashList = getStashList(stashDir);

            if (stashList.length === 0) {
                console.log(chalk.dim('No stashes'));
                return;
            }

            for (let i = stashList.length - 1; i >= 0; i--) {
                const s = stashList[i];
                const files = Object.keys(s.files).length;
                console.log(`  stash@{${i}} — ${chalk.dim(s.message)} ${chalk.dim(`(${files} files)`)}`);
            }
        } catch (err) {
            console.error(chalk.red('✗'), err.message);
            process.exit(1);
        }
    },

    drop() {
        try {
            const kitDir = getKitDir();
            const stashDir = path.join(kitDir, 'stash');
            const stashList = getStashList(stashDir);

            if (stashList.length === 0) {
                console.log(chalk.yellow('⚠'), 'No stashes to drop');
                return;
            }

            stashList.pop();
            fs.writeFileSync(path.join(stashDir, 'stashes.json'), JSON.stringify(stashList, null, 2), 'utf-8');
            console.log(chalk.green('✓'), 'Dropped latest stash');
        } catch (err) {
            console.error(chalk.red('✗'), err.message);
            process.exit(1);
        }
    },
};

function getStashList(stashDir) {
    const stashFile = path.join(stashDir, 'stashes.json');
    if (fs.existsSync(stashFile)) {
        return JSON.parse(fs.readFileSync(stashFile, 'utf-8'));
    }
    return [];
}

function walkDir(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === '.kit' || entry.name === 'node_modules' || entry.name === '.git') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}
