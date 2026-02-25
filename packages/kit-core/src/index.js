// Kitwork Core — VCS Engine
// Exports all core modules for use by CLI and server

const repo = require('./repo');
const objects = require('./objects');
const indexFile = require('./index-file');
const tree = require('./tree');
const commit = require('./commit');
const refs = require('./refs');
const diff = require('./diff');
const merge = require('./merge');

module.exports = {
    // Repo
    initRepo: repo.initRepo,
    findKitRoot: repo.findKitRoot,
    getKitDir: repo.getKitDir,

    // Objects
    hashObject: objects.hashObject,
    readObject: objects.readObject,
    objectExists: objects.objectExists,

    // Index / Staging
    readIndex: indexFile.readIndex,
    writeIndex: indexFile.writeIndex,
    addToIndex: indexFile.addToIndex,
    addPaths: indexFile.addPaths,

    // Trees
    createTree: tree.createTree,
    readTree: tree.readTree,
    flattenTree: tree.flattenTree,

    // Commits
    createCommit: commit.createCommit,
    readCommit: commit.readCommit,
    walkHistory: commit.walkHistory,

    // Refs
    getHead: refs.getHead,
    resolveHead: refs.resolveHead,
    updateRef: refs.updateRef,
    listBranches: refs.listBranches,
    createBranch: refs.createBranch,
    setHead: refs.setHead,
    resolveRef: refs.resolveRef,

    // Diff
    diffLines: diff.diffLines,
    getStatus: diff.getStatus,
    diffWorkingTree: diff.diffWorkingTree,

    // Merge
    merge: merge.merge,
    checkoutTree: merge.checkoutTree,
};
