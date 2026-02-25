const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getKitDir, resolveRef } = require('kit-core');

/**
 * kit tag — Manage tags.
 * Usage:
 *   kit tag                     ← list all tags
 *   kit tag v1.0.0              ← tag current HEAD
 *   kit tag v1.0.0 <commit>     ← tag a specific commit
 *   kit tag -d v1.0.0           ← delete a tag
 */
module.exports = {
    create(name, commitHash, options) {
        try {
            const kitDir = getKitDir();
            const tagsDir = path.join(kitDir, 'refs', 'tags');
            fs.mkdirSync(tagsDir, { recursive: true });

            if (options && options.delete) {
                // Delete tag
                const tagPath = path.join(tagsDir, name);
                if (fs.existsSync(tagPath)) {
                    fs.unlinkSync(tagPath);
                    console.log(chalk.green('✓'), `Deleted tag ${chalk.bold(name)}`);
                } else {
                    console.error(chalk.red('✗'), `Tag '${name}' not found`);
                }
                return;
            }

            if (!name) {
                // List tags
                if (!fs.existsSync(tagsDir)) {
                    console.log(chalk.dim('No tags'));
                    return;
                }
                const tags = fs.readdirSync(tagsDir);
                if (tags.length === 0) {
                    console.log(chalk.dim('No tags'));
                    return;
                }
                for (const tag of tags.sort()) {
                    const hash = fs.readFileSync(path.join(tagsDir, tag), 'utf-8').trim();
                    console.log(`  ${chalk.yellow(tag)}  ${chalk.dim(hash.slice(0, 8))}`);
                }
                return;
            }

            // Create tag
            const hash = commitHash || resolveRef('HEAD', kitDir);
            if (!hash) {
                console.error(chalk.red('✗'), 'No commits to tag');
                process.exit(1);
            }

            const tagPath = path.join(tagsDir, name);
            if (fs.existsSync(tagPath)) {
                console.error(chalk.red('✗'), `Tag '${name}' already exists`);
                process.exit(1);
            }

            fs.writeFileSync(tagPath, hash + '\n', 'utf-8');
            console.log(chalk.green('✓'), `Tagged ${chalk.yellow(hash.slice(0, 8))} as ${chalk.bold(name)}`);
        } catch (err) {
            console.error(chalk.red('✗'), err.message);
            process.exit(1);
        }
    }
};
