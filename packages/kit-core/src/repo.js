const fs = require('fs');
const path = require('path');

/**
 * Initialize a new Kitwork repository.
 * Creates the .kit directory structure.
 *
 * @param {string} [dir] - directory to initialize in (defaults to cwd)
 * @returns {string} path to the created .kit directory
 */
function initRepo(dir = process.cwd()) {
    const kitDir = path.join(dir, '.kit');

    if (fs.existsSync(kitDir)) {
        throw new Error(`Already a Kitwork repository: ${kitDir}`);
    }

    // Create directory structure
    fs.mkdirSync(path.join(kitDir, 'objects'), { recursive: true });
    fs.mkdirSync(path.join(kitDir, 'refs', 'heads'), { recursive: true });
    fs.mkdirSync(path.join(kitDir, 'refs', 'tags'), { recursive: true });

    // HEAD points to main by default
    fs.writeFileSync(path.join(kitDir, 'HEAD'), 'ref: refs/heads/main\n', 'utf-8');

    // Empty index (staging area)
    fs.writeFileSync(path.join(kitDir, 'index'), JSON.stringify({ entries: {} }), 'utf-8');

    // Config file
    fs.writeFileSync(
        path.join(kitDir, 'config'),
        JSON.stringify({ remotes: {} }, null, 2),
        'utf-8'
    );

    return kitDir;
}

/**
 * Walk up directories to find the root of a Kitwork repo.
 *
 * @param {string} [startDir] - directory to start searching from
 * @returns {string} the repo root directory (parent of .kit)
 * @throws if no .kit directory is found
 */
function findKitRoot(startDir = process.cwd()) {
    let current = path.resolve(startDir);

    while (true) {
        const kitDir = path.join(current, '.kit');
        if (fs.existsSync(kitDir) && fs.statSync(kitDir).isDirectory()) {
            return current;
        }

        const parent = path.dirname(current);
        if (parent === current) {
            throw new Error('Not a Kitwork repository (or any parent directory): .kit not found');
        }
        current = parent;
    }
}

/**
 * Get the path to the .kit directory.
 * @param {string} [startDir]
 * @returns {string}
 */
function getKitDir(startDir = process.cwd()) {
    return path.join(findKitRoot(startDir), '.kit');
}

module.exports = { initRepo, findKitRoot, getKitDir };
