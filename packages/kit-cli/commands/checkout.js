const chalk = require('chalk');
const { setHead, resolveRef, checkoutTree, getKitDir } = require('kit-core');
const path = require('path');
const fs = require('fs');

module.exports = function checkout(branchName) {
    try {
        const kitDir = getKitDir();

        // Check branch exists
        const branchFile = path.join(kitDir, 'refs', 'heads', branchName);
        if (!fs.existsSync(branchFile)) {
            console.error(chalk.red('✗'), `Branch '${branchName}' not found`);
            process.exit(1);
        }

        const commitHash = resolveRef(branchName);
        if (commitHash) {
            const repoRoot = path.dirname(kitDir);
            checkoutTree(commitHash, repoRoot, kitDir);
        }

        setHead(branchName);
        console.log(chalk.green('✓') + ` Switched to branch ${chalk.bold(branchName)}`);
    } catch (err) {
        console.error(chalk.red('✗'), err.message);
        process.exit(1);
    }
};
