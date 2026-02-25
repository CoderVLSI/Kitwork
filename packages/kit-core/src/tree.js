const path = require('path');
const { hashObject, readObject } = require('./objects');
const { getKitDir } = require('./repo');

/**
 * Create a tree object from a flat list of index entries.
 * Groups files into nested trees based on directory structure.
 *
 * Tree format (stored as text for readability):
 *   <mode> <type> <hash> <name>\n
 *
 * @param {Object<string, { hash: string }>} entries - { "path/to/file": { hash } }
 * @param {string} [kitDir]
 * @returns {string} the tree hash
 */
function createTree(entries, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();

    // Build nested directory structure
    const root = {};
    for (const [filepath, entry] of Object.entries(entries)) {
        const parts = filepath.split('/');
        let current = root;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = entry.hash;
    }

    return writeTreeRecursive(root, kitDir);
}

/**
 * Recursively write nested tree structure.
 */
function writeTreeRecursive(node, kitDir) {
    const lines = [];

    // Sort entries for deterministic hashing
    const keys = Object.keys(node).sort();

    for (const name of keys) {
        const value = node[name];
        if (typeof value === 'string') {
            // It's a blob (leaf file)
            lines.push(`100644 blob ${value} ${name}`);
        } else {
            // It's a subtree (directory) — recurse
            const subtreeHash = writeTreeRecursive(value, kitDir);
            lines.push(`040000 tree ${subtreeHash} ${name}`);
        }
    }

    const treeContent = lines.join('\n') + (lines.length > 0 ? '\n' : '');
    return hashObject(treeContent, 'tree', kitDir);
}

/**
 * Parse a tree object back into entries.
 *
 * @param {string} hash
 * @param {string} [kitDir]
 * @returns {Array<{ mode: string, type: string, hash: string, name: string }>}
 */
function readTree(hash, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const { type, content } = readObject(hash, kitDir);

    if (type !== 'tree') {
        throw new Error(`Expected tree object, got ${type}`);
    }

    const lines = content.toString('utf-8').trim().split('\n').filter(Boolean);
    return lines.map(line => {
        const [mode, objType, objHash, ...nameParts] = line.split(' ');
        return { mode, type: objType, hash: objHash, name: nameParts.join(' ') };
    });
}

/**
 * Flatten a tree into a map of { "path/to/file": hash }.
 *
 * @param {string} treeHash
 * @param {string} [prefix]
 * @param {string} [kitDir]
 * @returns {Object<string, string>}
 */
function flattenTree(treeHash, prefix = '', kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const entries = readTree(treeHash, kitDir);
    const result = {};

    for (const entry of entries) {
        const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.type === 'tree') {
            Object.assign(result, flattenTree(entry.hash, fullPath, kitDir));
        } else {
            result[fullPath] = entry.hash;
        }
    }

    return result;
}

module.exports = { createTree, readTree, flattenTree };
