const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db');
const { requireAuth, optionalAuth } = require('../auth');

const router = express.Router();

// Where server stores repo objects on disk
const REPOS_DIR = path.join(__dirname, '..', '..', 'data', 'repos');

/**
 * POST /api/repos — Create a new repository
 */
router.post('/', requireAuth, (req, res) => {
    try {
        const { name, description, isPublic } = req.body;

        if (!name || !/^[a-zA-Z0-9._-]+$/.test(name)) {
            return res.status(400).json({ error: 'Invalid repository name' });
        }

        const db = getDb();
        const existing = db.prepare('SELECT id FROM repos WHERE owner_id = ? AND name = ?').get(req.user.id, name);
        if (existing) {
            return res.status(409).json({ error: 'Repository already exists' });
        }

        const result = db.prepare(
            'INSERT INTO repos (name, owner_id, description, is_public) VALUES (?, ?, ?, ?)'
        ).run(name, req.user.id, description || '', isPublic !== false ? 1 : 0);

        // Create repo directory on disk
        const repoDir = path.join(REPOS_DIR, req.user.username, name);
        fs.mkdirSync(path.join(repoDir, 'objects'), { recursive: true });
        fs.mkdirSync(path.join(repoDir, 'refs', 'heads'), { recursive: true });
        fs.writeFileSync(path.join(repoDir, 'HEAD'), 'ref: refs/heads/main\n');

        res.status(201).json({
            repo: {
                id: result.lastInsertRowid,
                name,
                owner: req.user.username,
                description: description || '',
                isPublic: isPublic !== false,
                defaultBranch: 'main',
            },
        });
    } catch (err) {
        console.error('Create repo error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/repos/:user/:repo — Get repository metadata
 */
router.get('/:user/:repo', optionalAuth, (req, res) => {
    try {
        const db = getDb();
        const owner = db.prepare('SELECT id, username FROM users WHERE username = ?').get(req.params.user);
        if (!owner) return res.status(404).json({ error: 'User not found' });

        const repo = db.prepare('SELECT * FROM repos WHERE owner_id = ? AND name = ?').get(owner.id, req.params.repo);
        if (!repo) return res.status(404).json({ error: 'Repository not found' });

        if (!repo.is_public && (!req.user || req.user.id !== owner.id)) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        // Get branches
        const repoDir = path.join(REPOS_DIR, req.params.user, req.params.repo);
        const branches = [];
        const headsDir = path.join(repoDir, 'refs', 'heads');
        if (fs.existsSync(headsDir)) {
            for (const f of fs.readdirSync(headsDir)) {
                const hash = fs.readFileSync(path.join(headsDir, f), 'utf-8').trim();
                branches.push({ name: f, hash });
            }
        }

        res.json({
            repo: {
                id: repo.id,
                name: repo.name,
                owner: req.params.user,
                description: repo.description,
                isPublic: !!repo.is_public,
                defaultBranch: repo.default_branch,
                createdAt: repo.created_at,
                branches,
            },
        });
    } catch (err) {
        console.error('Get repo error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/repos/:user — List user's repos
 */
router.get('/:user', optionalAuth, (req, res) => {
    try {
        const db = getDb();
        const owner = db.prepare('SELECT id, username, display_name, bio FROM users WHERE username = ?').get(req.params.user);
        if (!owner) return res.status(404).json({ error: 'User not found' });

        let repos;
        if (req.user && req.user.id === owner.id) {
            repos = db.prepare('SELECT * FROM repos WHERE owner_id = ? ORDER BY updated_at DESC').all(owner.id);
        } else {
            repos = db.prepare('SELECT * FROM repos WHERE owner_id = ? AND is_public = 1 ORDER BY updated_at DESC').all(owner.id);
        }

        res.json({
            user: { username: owner.username, displayName: owner.display_name, bio: owner.bio },
            repos: repos.map(r => ({
                name: r.name,
                description: r.description,
                isPublic: !!r.is_public,
                defaultBranch: r.default_branch,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            })),
        });
    } catch (err) {
        console.error('List repos error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/repos/:user/:repo/tree/:ref — Browse file tree
 */
router.get('/:user/:repo/tree/:ref', optionalAuth, (req, res) => {
    try {
        const repoDir = path.join(REPOS_DIR, req.params.user, req.params.repo);
        if (!fs.existsSync(repoDir)) return res.status(404).json({ error: 'Repository not found' });

        const refFile = path.join(repoDir, 'refs', 'heads', req.params.ref);
        if (!fs.existsSync(refFile)) return res.status(404).json({ error: 'Branch not found' });

        const commitHash = fs.readFileSync(refFile, 'utf-8').trim();
        const { readObject } = require('kit-core');

        // Read commit to get tree
        const commitObj = readObject(commitHash, repoDir);
        const commitText = commitObj.content.toString('utf-8');
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return res.status(500).json({ error: 'Invalid commit object' });

        const treePath = req.query.path || '';
        const tree = readTreeFromRepo(treeMatch[1], repoDir, treePath);

        res.json({ ref: req.params.ref, path: treePath, entries: tree });
    } catch (err) {
        console.error('Tree error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/repos/:user/:repo/blob/:ref/*path — Read file content
 */
router.get('/:user/:repo/blob/:ref/*', optionalAuth, (req, res) => {
    try {
        const repoDir = path.join(REPOS_DIR, req.params.user, req.params.repo);
        if (!fs.existsSync(repoDir)) return res.status(404).json({ error: 'Repository not found' });

        const refFile = path.join(repoDir, 'refs', 'heads', req.params.ref);
        if (!fs.existsSync(refFile)) return res.status(404).json({ error: 'Branch not found' });

        const commitHash = fs.readFileSync(refFile, 'utf-8').trim();
        const { readObject } = require('kit-core');

        // Read commit → tree → walk to file
        const commitObj = readObject(commitHash, repoDir);
        const commitText = commitObj.content.toString('utf-8');
        const treeMatch = commitText.match(/^tree (\w+)/m);

        const filePath = req.params[0];
        const blobHash = findBlobInTree(treeMatch[1], repoDir, filePath);

        if (!blobHash) return res.status(404).json({ error: 'File not found' });

        const blob = readObject(blobHash, repoDir);
        res.json({
            path: filePath,
            content: blob.content.toString('utf-8'),
            hash: blobHash,
            size: blob.content.length,
        });
    } catch (err) {
        console.error('Blob error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/repos/:user/:repo/commits — List commits
 */
router.get('/:user/:repo/commits', optionalAuth, (req, res) => {
    try {
        const repoDir = path.join(REPOS_DIR, req.params.user, req.params.repo);
        if (!fs.existsSync(repoDir)) return res.status(404).json({ error: 'Repository not found' });

        const branch = req.query.branch || 'main';
        const refFile = path.join(repoDir, 'refs', 'heads', branch);
        if (!fs.existsSync(refFile)) return res.json({ commits: [] });

        const { readObject } = require('kit-core');
        let currentHash = fs.readFileSync(refFile, 'utf-8').trim();
        const commits = [];
        const limit = parseInt(req.query.limit) || 50;

        while (currentHash && commits.length < limit) {
            const obj = readObject(currentHash, repoDir);
            const text = obj.content.toString('utf-8');
            const [headerBlock, ...msgParts] = text.split('\n\n');
            const headers = headerBlock.split('\n');

            const commit = { hash: currentHash, parent: null, tree: null, author: null, timestamp: null, message: msgParts.join('\n\n').trim() };
            for (const line of headers) {
                if (line.startsWith('tree ')) commit.tree = line.slice(5);
                else if (line.startsWith('parent ')) commit.parent = line.slice(7);
                else if (line.startsWith('author ')) {
                    const parts = line.slice(7);
                    const tsMatch = parts.match(/\s(\d+)$/);
                    if (tsMatch) {
                        commit.timestamp = parseInt(tsMatch[1], 10);
                        commit.author = parts.slice(0, tsMatch.index);
                    }
                }
            }

            commits.push(commit);
            currentHash = commit.parent;
        }

        res.json({ branch, commits });
    } catch (err) {
        console.error('Commits error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/repos/:user/:repo/push — Receive pushed objects
 * Body: { branch, commitHash, objects: [{ hash, data (base64) }] }
 */
router.post('/:user/:repo/push', (req, res) => {
    try {
        const { branch, commitHash, objects } = req.body;
        const repoDir = path.join(REPOS_DIR, req.params.user, req.params.repo);

        // Auto-create repo directory if it doesn't exist
        fs.mkdirSync(path.join(repoDir, 'objects'), { recursive: true });
        fs.mkdirSync(path.join(repoDir, 'refs', 'heads'), { recursive: true });

        // Store objects
        for (const obj of objects) {
            const dir = path.join(repoDir, 'objects', obj.hash.slice(0, 2));
            const filePath = path.join(dir, obj.hash.slice(2));
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(filePath, Buffer.from(obj.data, 'base64'));
            }
        }

        // Update branch ref
        fs.writeFileSync(path.join(repoDir, 'refs', 'heads', branch), commitHash + '\n');

        // Update repo timestamp
        const db = getDb();
        const owner = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.user);
        if (owner) {
            db.prepare('UPDATE repos SET updated_at = CURRENT_TIMESTAMP WHERE owner_id = ? AND name = ?')
                .run(owner.id, req.params.repo);
        }

        res.json({ success: true, received: objects.length });
    } catch (err) {
        console.error('Push error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/repos/:user/:repo/pull — Send objects for pull
 * Query: ?branch=main
 */
router.get('/:user/:repo/pull', (req, res) => {
    try {
        const branch = req.query.branch || 'main';
        const repoDir = path.join(REPOS_DIR, req.params.user, req.params.repo);

        if (!fs.existsSync(repoDir)) return res.status(404).json({ error: 'Repository not found' });

        const refFile = path.join(repoDir, 'refs', 'heads', branch);
        if (!fs.existsSync(refFile)) return res.status(404).json({ error: 'Branch not found' });

        const commitHash = fs.readFileSync(refFile, 'utf-8').trim();

        // Collect all objects
        const objects = [];
        const visited = new Set();
        collectAllObjects(repoDir, commitHash, visited);

        for (const hash of visited) {
            const objPath = path.join(repoDir, 'objects', hash.slice(0, 2), hash.slice(2));
            if (fs.existsSync(objPath)) {
                objects.push({ hash, data: fs.readFileSync(objPath).toString('base64') });
            }
        }

        res.json({ branch, commitHash, objects });
    } catch (err) {
        console.error('Pull error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── Helper Functions ───

function readTreeFromRepo(treeHash, repoDir, targetPath) {
    const { readObject } = require('kit-core');
    const obj = readObject(treeHash, repoDir);
    const lines = obj.content.toString('utf-8').trim().split('\n').filter(Boolean);

    const entries = lines.map(line => {
        const [mode, type, hash, ...nameParts] = line.split(' ');
        return { mode, type, hash, name: nameParts.join(' ') };
    });

    if (!targetPath) return entries;

    // Navigate to subdirectory
    const parts = targetPath.split('/').filter(Boolean);
    let currentEntries = entries;

    for (const part of parts) {
        const found = currentEntries.find(e => e.name === part && e.type === 'tree');
        if (!found) return [];
        const subObj = readObject(found.hash, repoDir);
        const subLines = subObj.content.toString('utf-8').trim().split('\n').filter(Boolean);
        currentEntries = subLines.map(line => {
            const [mode, type, hash, ...nameParts] = line.split(' ');
            return { mode, type, hash, name: nameParts.join(' ') };
        });
    }

    return currentEntries;
}

function findBlobInTree(treeHash, repoDir, filePath) {
    const { readObject } = require('kit-core');
    const parts = filePath.split('/').filter(Boolean);

    let currentHash = treeHash;
    for (let i = 0; i < parts.length; i++) {
        const obj = readObject(currentHash, repoDir);
        const lines = obj.content.toString('utf-8').trim().split('\n').filter(Boolean);

        const target = parts[i];
        let found = false;

        for (const line of lines) {
            const [mode, type, hash, ...nameParts] = line.split(' ');
            const name = nameParts.join(' ');
            if (name === target) {
                if (i === parts.length - 1 && type === 'blob') return hash;
                if (type === 'tree') { currentHash = hash; found = true; break; }
            }
        }

        if (!found && i < parts.length - 1) return null;
    }

    return null;
}

function collectAllObjects(repoDir, hash, visited) {
    if (visited.has(hash)) return;
    visited.add(hash);

    const { readObject } = require('kit-core');
    try {
        const obj = readObject(hash, repoDir);
        const text = obj.content.toString('utf-8');

        if (obj.type === 'commit') {
            const treeMatch = text.match(/^tree (\w+)/m);
            if (treeMatch) collectAllObjects(repoDir, treeMatch[1], visited);
            const parentMatch = text.match(/^parent (\w+)/m);
            if (parentMatch) collectAllObjects(repoDir, parentMatch[1], visited);
        } else if (obj.type === 'tree') {
            const lines = text.trim().split('\n').filter(Boolean);
            for (const line of lines) {
                const parts = line.split(' ');
                const objHash = parts[2];
                collectAllObjects(repoDir, objHash, visited);
            }
        }
    } catch { /* object might not exist */ }
}

module.exports = router;
