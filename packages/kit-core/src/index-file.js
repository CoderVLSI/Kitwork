const fs = require('fs');
const path = require('path');
const { hashObject } = require('./objects');
const { getKitDir } = require('./repo');

/**
 * Read the staging index from .kit/index
 * @param {string} [kitDir]
 * @returns {{ entries: Object<string, { hash: string, mtime: number }> }}
 */
function readIndex(kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const indexPath = path.join(kitDir, 'index');
    if (!fs.existsSync(indexPath)) {
        return { entries: {} };
    }
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

/**
 * Write the staging index to .kit/index
 * @param {{ entries: Object }} index
 * @param {string} [kitDir]
 */
function writeIndex(index, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    fs.writeFileSync(path.join(kitDir, 'index'), JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Add a file to the staging area.
 * Creates a blob object and records it in the index.
 *
 * @param {string} filepath - relative path from repo root
 * @param {string} [repoRoot] - repo root directory
 * @returns {string} the blob hash
 */
function addToIndex(filepath, repoRoot = null) {
    const { findKitRoot } = require('./repo');
    if (!repoRoot) repoRoot = findKitRoot();
    const kitDir = path.join(repoRoot, '.kit');

    const absPath = path.resolve(repoRoot, filepath);
    if (!fs.existsSync(absPath)) {
        throw new Error(`File not found: ${filepath}`);
    }

    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
        throw new Error(`Cannot add directory directly. Add files inside it: ${filepath}`);
    }

    const content = fs.readFileSync(absPath);
    const hash = hashObject(content, 'blob', kitDir);

    // Normalize to forward slashes for cross-platform consistency
    const normalizedPath = filepath.split(path.sep).join('/');

    const index = readIndex(kitDir);
    index.entries[normalizedPath] = {
        hash,
        mtime: stat.mtimeMs,
        size: stat.size,
    };
    writeIndex(index, kitDir);

    return hash;
}

/**
 * Add multiple files or directories recursively.
 * If '.' is passed, adds all files in the repo.
 *
 * @param {string[]} paths - list of file/directory paths
 * @param {string} [repoRoot]
 * @returns {string[]} list of added file paths
 */
function addPaths(paths, repoRoot = null) {
    const { findKitRoot } = require('./repo');
    if (!repoRoot) repoRoot = findKitRoot();

    const added = [];

    for (const p of paths) {
        const absPath = path.resolve(repoRoot, p);

        if (fs.statSync(absPath).isDirectory()) {
            // Recursively add all files
            const files = walkDir(absPath, repoRoot);
            for (const file of files) {
                addToIndex(file, repoRoot);
                added.push(file);
            }
        } else {
            const rel = path.relative(repoRoot, absPath);
            addToIndex(rel, repoRoot);
            added.push(rel);
        }
    }

    return added;
}

/**
 * Recursively walk directory and return relative file paths.
 * Ignores .kit directory and node_modules.
 */
function walkDir(dir, repoRoot) {
    const IGNORED = ['.kit', 'node_modules', '.git', '.DS_Store'];
    const results = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (IGNORED.includes(entry.name)) continue;

        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(full, repoRoot));
        } else if (entry.isFile()) {
            results.push(path.relative(repoRoot, full));
        }
    }

    return results;
}

module.exports = { readIndex, writeIndex, addToIndex, addPaths };
