const fs = require('fs');
const path = require('path');
const { getKitDir, findKitRoot } = require('./repo');
const { readObject } = require('./objects');
const { readIndex } = require('./index-file');
const { resolveHead } = require('./refs');
const { readCommit } = require('./commit');
const { flattenTree } = require('./tree');

/**
 * Simple line-by-line diff between two strings.
 * Returns array of { type: '+' | '-' | ' ', line: string }
 *
 * Uses a basic LCS (Longest Common Subsequence) approach.
 *
 * @param {string} oldText
 * @param {string} newText
 * @returns {Array<{ type: string, line: string }>}
 */
function diffLines(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    // Build LCS table
    const m = oldLines.length;
    const n = newLines.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to produce diff
    const result = [];
    let i = m, j = n;
    const stack = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            stack.push({ type: ' ', line: oldLines[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            stack.push({ type: '+', line: newLines[j - 1] });
            j--;
        } else {
            stack.push({ type: '-', line: oldLines[i - 1] });
            i--;
        }
    }

    return stack.reverse();
}

/**
 * Get the status of the working tree.
 * Compares: last commit <-> index <-> working tree
 *
 * @param {string} [kitDir]
 * @returns {{ staged: string[], modified: string[], untracked: string[] }}
 */
function getStatus(kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const repoRoot = path.dirname(kitDir);
    const index = readIndex(kitDir);

    // Get files from last commit
    let committedFiles = {};
    const headHash = resolveHead(kitDir);
    if (headHash) {
        const commit = readCommit(headHash, kitDir);
        committedFiles = flattenTree(commit.tree, '', kitDir);
    }

    // Compare committed files vs index (staged changes)
    const staged = [];
    const indexPaths = Object.keys(index.entries);

    for (const filepath of indexPaths) {
        const indexHash = index.entries[filepath].hash;
        const committedHash = committedFiles[filepath];
        if (!committedHash) {
            staged.push(`new file: ${filepath}`);
        } else if (indexHash !== committedHash) {
            staged.push(`modified: ${filepath}`);
        }
    }

    // Check for deleted files (in commit but not in index)
    for (const filepath of Object.keys(committedFiles)) {
        if (!index.entries[filepath]) {
            staged.push(`deleted: ${filepath}`);
        }
    }

    // Compare index vs working tree (unstaged changes)
    const modified = [];
    const untracked = [];

    // Walk working directory
    const workingFiles = walkWorkingDir(repoRoot);

    for (const filepath of workingFiles) {
        if (index.entries[filepath]) {
            // File is tracked — check if modified
            const absPath = path.join(repoRoot, filepath);
            const stat = fs.statSync(absPath);
            if (stat.mtimeMs !== index.entries[filepath].mtime) {
                // mtime changed — read and compare hash
                const crypto = require('crypto');
                const content = fs.readFileSync(absPath);
                const header = `blob ${content.length}\0`;
                const store = Buffer.concat([Buffer.from(header), content]);
                const hash = crypto.createHash('sha256').update(store).digest('hex');
                if (hash !== index.entries[filepath].hash) {
                    modified.push(filepath);
                }
            }
        } else {
            untracked.push(filepath);
        }
    }

    return { staged, modified, untracked };
}

/**
 * Walk working directory, returns relative paths.
 */
function walkWorkingDir(repoRoot) {
    const IGNORED = ['.kit', 'node_modules', '.git', '.DS_Store'];
    const results = [];

    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (IGNORED.includes(entry.name)) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.isFile()) {
                results.push(path.relative(repoRoot, full).split(path.sep).join('/'));
            }
        }
    }

    walk(repoRoot);
    return results;
}

/**
 * Diff the working tree against the last commit.
 * @param {string} [kitDir]
 * @returns {Array<{ file: string, diff: Array }>}
 */
function diffWorkingTree(kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const repoRoot = path.dirname(kitDir);

    const headHash = resolveHead(kitDir);
    if (!headHash) return [];

    const commit = readCommit(headHash, kitDir);
    const committedFiles = flattenTree(commit.tree, '', kitDir);
    const diffs = [];

    for (const [filepath, blobHash] of Object.entries(committedFiles)) {
        const absPath = path.join(repoRoot, filepath);
        if (!fs.existsSync(absPath)) {
            diffs.push({ file: filepath, status: 'deleted', diff: [] });
            continue;
        }

        const oldContent = readObject(blobHash, kitDir).content.toString('utf-8');
        const newContent = fs.readFileSync(absPath, 'utf-8');

        if (oldContent !== newContent) {
            diffs.push({
                file: filepath,
                status: 'modified',
                diff: diffLines(oldContent, newContent),
            });
        }
    }

    return diffs;
}

module.exports = { diffLines, getStatus, diffWorkingTree };
