const { hashObject, readObject } = require('./objects');
const { getKitDir } = require('./repo');
const { readIndex, writeIndex } = require('./index-file');
const { createTree, flattenTree } = require('./tree');
const { getHead, resolveHead, updateRef } = require('./refs');

/**
 * Create a new commit from the current staging area.
 *
 * Commit format:
 *   tree <treeHash>
 *   parent <parentHash>     (omitted for first commit)
 *   author <name> <timestamp>
 *   committer <name> <timestamp>
 *
 *   <message>
 *
 * @param {string} message
 * @param {string} [author]
 * @param {string} [kitDir]
 * @returns {string} the commit hash
 */
function createCommit(message, author = 'Kitwork User', kitDir = null) {
    if (!kitDir) kitDir = getKitDir();

    const index = readIndex(kitDir);
    if (Object.keys(index.entries).length === 0) {
        throw new Error('Nothing to commit: staging area is empty');
    }

    // Build tree from index
    const treeHash = createTree(index.entries, kitDir);

    // Build commit content
    const timestamp = Math.floor(Date.now() / 1000);
    const lines = [];
    lines.push(`tree ${treeHash}`);

    const parentHash = resolveHead(kitDir);
    if (parentHash) {
        lines.push(`parent ${parentHash}`);
    }

    lines.push(`author ${author} ${timestamp}`);
    lines.push(`committer ${author} ${timestamp}`);
    lines.push('');
    lines.push(message);

    const commitContent = lines.join('\n') + '\n';
    const commitHash = hashObject(commitContent, 'commit', kitDir);

    // Update the current branch ref
    const head = getHead(kitDir);
    if (head.type === 'branch') {
        updateRef(head.ref, commitHash, kitDir);
    }

    return commitHash;
}

/**
 * Read and parse a commit object.
 * @param {string} hash
 * @param {string} [kitDir]
 * @returns {{ hash: string, tree: string, parent: string|null, author: string, timestamp: number, message: string }}
 */
function readCommit(hash, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const { type, content } = readObject(hash, kitDir);

    if (type !== 'commit') {
        throw new Error(`Expected commit object, got ${type}`);
    }

    const text = content.toString('utf-8');
    const [headerBlock, ...messageLines] = text.split('\n\n');
    const headers = headerBlock.split('\n');

    const commit = {
        hash,
        tree: null,
        parent: null,
        author: null,
        timestamp: null,
        message: messageLines.join('\n\n').trim(),
    };

    for (const line of headers) {
        if (line.startsWith('tree ')) commit.tree = line.slice(5);
        else if (line.startsWith('parent ')) commit.parent = line.slice(7);
        else if (line.startsWith('author ')) {
            const parts = line.slice(7);
            const tsMatch = parts.match(/\s(\d+)$/);
            if (tsMatch) {
                commit.timestamp = parseInt(tsMatch[1], 10);
                commit.author = parts.slice(0, tsMatch.index);
            } else {
                commit.author = parts;
            }
        }
    }

    return commit;
}

/**
 * Walk commit history from a starting hash, yielding each commit.
 * @param {string} [startHash] - defaults to HEAD
 * @param {string} [kitDir]
 * @returns {Array<Object>}
 */
function walkHistory(startHash = null, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    if (!startHash) startHash = resolveHead(kitDir);
    if (!startHash) return [];

    const commits = [];
    let current = startHash;

    while (current) {
        const commit = readCommit(current, kitDir);
        commits.push(commit);
        current = commit.parent;
    }

    return commits;
}

module.exports = { createCommit, readCommit, walkHistory };
