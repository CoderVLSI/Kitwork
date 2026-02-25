const fs = require('fs');
const path = require('path');
const { getKitDir } = require('./repo');

/**
 * Read the HEAD reference.
 * Returns either { type: 'branch', name: 'main' } or { type: 'detached', hash: '...' }
 *
 * @param {string} [kitDir]
 * @returns {{ type: 'branch'|'detached', name?: string, hash?: string }}
 */
function getHead(kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const headContent = fs.readFileSync(path.join(kitDir, 'HEAD'), 'utf-8').trim();

    if (headContent.startsWith('ref: ')) {
        const refPath = headContent.slice(5);
        const branchName = refPath.replace('refs/heads/', '');
        return { type: 'branch', name: branchName, ref: refPath };
    }

    return { type: 'detached', hash: headContent };
}

/**
 * Resolve HEAD to a commit hash.
 * Returns null if the branch has no commits yet (fresh repo).
 *
 * @param {string} [kitDir]
 * @returns {string|null}
 */
function resolveHead(kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const head = getHead(kitDir);

    if (head.type === 'detached') {
        return head.hash;
    }

    // Read the branch ref file
    const refFile = path.join(kitDir, head.ref);
    if (!fs.existsSync(refFile)) {
        return null; // branch has no commits yet
    }

    return fs.readFileSync(refFile, 'utf-8').trim();
}

/**
 * Update a ref to point to a new hash.
 *
 * @param {string} refPath - e.g. "refs/heads/main"
 * @param {string} hash
 * @param {string} [kitDir]
 */
function updateRef(refPath, hash, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const fullPath = path.join(kitDir, refPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, hash + '\n', 'utf-8');
}

/**
 * List all branches.
 * @param {string} [kitDir]
 * @returns {Array<{ name: string, hash: string, current: boolean }>}
 */
function listBranches(kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const headsDir = path.join(kitDir, 'refs', 'heads');
    const head = getHead(kitDir);
    const branches = [];

    if (!fs.existsSync(headsDir)) return branches;

    const files = fs.readdirSync(headsDir);
    for (const file of files) {
        const hash = fs.readFileSync(path.join(headsDir, file), 'utf-8').trim();
        branches.push({
            name: file,
            hash,
            current: head.type === 'branch' && head.name === file,
        });
    }

    return branches;
}

/**
 * Create a new branch pointing to the current HEAD.
 * @param {string} name
 * @param {string} [kitDir]
 */
function createBranch(name, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    const refPath = path.join(kitDir, 'refs', 'heads', name);

    if (fs.existsSync(refPath)) {
        throw new Error(`Branch '${name}' already exists`);
    }

    const headHash = resolveHead(kitDir);
    if (!headHash) {
        throw new Error('Cannot create branch: no commits yet');
    }

    fs.writeFileSync(refPath, headHash + '\n', 'utf-8');
}

/**
 * Set HEAD to point to a branch.
 * @param {string} branchName
 * @param {string} [kitDir]
 */
function setHead(branchName, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();
    fs.writeFileSync(
        path.join(kitDir, 'HEAD'),
        `ref: refs/heads/${branchName}\n`,
        'utf-8'
    );
}

/**
 * Resolve a ref name (branch name, hash, or "HEAD") to a commit hash.
 * @param {string} ref
 * @param {string} [kitDir]
 * @returns {string|null}
 */
function resolveRef(ref, kitDir = null) {
    if (!kitDir) kitDir = getKitDir();

    if (ref === 'HEAD') return resolveHead(kitDir);

    // Try as branch name
    const branchFile = path.join(kitDir, 'refs', 'heads', ref);
    if (fs.existsSync(branchFile)) {
        return fs.readFileSync(branchFile, 'utf-8').trim();
    }

    // Try as raw hash (at least 7 chars)
    if (/^[0-9a-f]{7,64}$/.test(ref)) {
        return ref;
    }

    return null;
}

module.exports = {
    getHead,
    resolveHead,
    updateRef,
    listBranches,
    createBranch,
    setHead,
    resolveRef,
};
