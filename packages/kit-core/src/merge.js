const fs = require('fs');
const path = require('path');
const { getKitDir } = require('./repo');
const { readObject } = require('./objects');
const { readIndex, writeIndex } = require('./index-file');
const { resolveHead, resolveRef, updateRef, getHead } = require('./refs');
const { readCommit } = require('./commit');
const { flattenTree } = require('./tree');

/**
 * Merge a branch into the current branch.
 * Supports fast-forward merges and basic 3-way merges.
 *
 * @param {string} branchName
 * @param {string} [kitDir]
 * @returns {{ type: 'fast-forward'|'merge'|'conflict', message: string }}
 */
function merge(branchName, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const repoRoot = path.dirname(kitDir);

    const currentHash = resolveHead(kitDir);
    const targetHash = resolveRef(branchName, kitDir);

    if (!targetHash) {
        throw new Error(`Branch '${branchName}' not found`);
    }

    if (!currentHash) {
        // No commits on current branch — just fast-forward
        const head = getHead(kitDir);
        if (head.type === 'branch') {
            updateRef(head.ref, targetHash, kitDir);
        }
        checkoutTree(targetHash, repoRoot, kitDir);
        return { type: 'fast-forward', message: `Fast-forwarded to ${branchName}` };
    }

    if (currentHash === targetHash) {
        return { type: 'merge', message: 'Already up to date.' };
    }

    // Check if target is ancestor of current (nothing to do)
    if (isAncestor(targetHash, currentHash, kitDir)) {
        return { type: 'merge', message: 'Already up to date.' };
    }

    // Check if current is ancestor of target (fast-forward)
    if (isAncestor(currentHash, targetHash, kitDir)) {
        const head = getHead(kitDir);
        if (head.type === 'branch') {
            updateRef(head.ref, targetHash, kitDir);
        }
        checkoutTree(targetHash, repoRoot, kitDir);
        return { type: 'fast-forward', message: `Fast-forwarded to ${branchName}` };
    }

    // 3-way merge: find common ancestor, merge trees
    const baseHash = findCommonAncestor(currentHash, targetHash, kitDir);
    if (!baseHash) {
        throw new Error('Cannot merge: no common ancestor found');
    }

    const baseCommit = readCommit(baseHash, kitDir);
    const currentCommit = readCommit(currentHash, kitDir);
    const targetCommit = readCommit(targetHash, kitDir);

    const baseFiles = flattenTree(baseCommit.tree, '', kitDir);
    const currentFiles = flattenTree(currentCommit.tree, '', kitDir);
    const targetFiles = flattenTree(targetCommit.tree, '', kitDir);

    // All unique paths
    const allPaths = new Set([
        ...Object.keys(baseFiles),
        ...Object.keys(currentFiles),
        ...Object.keys(targetFiles),
    ]);

    const conflicts = [];
    const mergedIndex = {};

    for (const filepath of allPaths) {
        const baseVer = baseFiles[filepath] || null;
        const currentVer = currentFiles[filepath] || null;
        const targetVer = targetFiles[filepath] || null;

        if (currentVer === targetVer) {
            // Same in both — use either
            if (currentVer) mergedIndex[filepath] = { hash: currentVer };
        } else if (currentVer === baseVer) {
            // Only target changed — take target
            if (targetVer) mergedIndex[filepath] = { hash: targetVer };
        } else if (targetVer === baseVer) {
            // Only current changed — keep current
            if (currentVer) mergedIndex[filepath] = { hash: currentVer };
        } else {
            // Both changed differently — conflict!
            conflicts.push(filepath);
            // Write conflict markers to working tree
            const currentContent = currentVer
                ? readObject(currentVer, kitDir).content.toString('utf-8')
                : '';
            const targetContent = targetVer
                ? readObject(targetVer, kitDir).content.toString('utf-8')
                : '';

            const conflictContent =
                `<<<<<<< HEAD\n${currentContent}=======\n${targetContent}>>>>>>> ${branchName}\n`;

            const absPath = path.join(repoRoot, filepath);
            fs.mkdirSync(path.dirname(absPath), { recursive: true });
            fs.writeFileSync(absPath, conflictContent, 'utf-8');

            if (currentVer) mergedIndex[filepath] = { hash: currentVer };
        }
    }

    if (conflicts.length > 0) {
        return {
            type: 'conflict',
            message: `Merge conflict in: ${conflicts.join(', ')}. Resolve and commit.`,
            conflicts,
        };
    }

    // Update index and working tree
    const index = { entries: {} };
    for (const [filepath, entry] of Object.entries(mergedIndex)) {
        index.entries[filepath] = { hash: entry.hash, mtime: Date.now(), size: 0 };

        // Write to working tree
        const content = readObject(entry.hash, kitDir).content;
        const absPath = path.join(repoRoot, filepath);
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, content);
    }
    writeIndex(index, kitDir);

    // Create merge commit
    const { createCommit } = require('./commit');
    const mergeHash = createCommit(`Merge branch '${branchName}'`, 'Kitwork User', kitDir);

    return { type: 'merge', message: `Merged '${branchName}' successfully.` };
}

/**
 * Check if ancestor is an ancestor of descendant.
 */
function isAncestor(ancestorHash, descendantHash, kitDir) {
    let current = descendantHash;
    while (current) {
        if (current === ancestorHash) return true;
        try {
            const commit = readCommit(current, kitDir);
            current = commit.parent;
        } catch {
            return false;
        }
    }
    return false;
}

/**
 * Find common ancestor of two commits.
 */
function findCommonAncestor(hash1, hash2, kitDir) {
    const ancestors1 = new Set();
    let current = hash1;
    while (current) {
        ancestors1.add(current);
        try {
            const commit = readCommit(current, kitDir);
            current = commit.parent;
        } catch {
            break;
        }
    }

    current = hash2;
    while (current) {
        if (ancestors1.has(current)) return current;
        try {
            const commit = readCommit(current, kitDir);
            current = commit.parent;
        } catch {
            break;
        }
    }

    return null;
}

/**
 * Check out the tree of a commit into the working directory.
 */
function checkoutTree(commitHash, repoRoot, kitDir) {
    const commit = readCommit(commitHash, kitDir);
    const files = flattenTree(commit.tree, '', kitDir);

    const index = { entries: {} };
    for (const [filepath, blobHash] of Object.entries(files)) {
        const content = readObject(blobHash, kitDir).content;
        const absPath = path.join(repoRoot, filepath);
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, content);

        const stat = fs.statSync(absPath);
        index.entries[filepath] = {
            hash: blobHash,
            mtime: stat.mtimeMs,
            size: stat.size,
        };
    }
    writeIndex(index, kitDir);
}

module.exports = { merge, checkoutTree };
