const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { generateToken } = require('../auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Body: { username, email, password, displayName? }
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'username, email, and password are required' });
        }

        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ error: 'Username must be 3-30 characters' });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, - and _' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const db = getDb();
        const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
        if (existing) {
            return res.status(409).json({ error: 'Username or email already taken' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = db.prepare(
            'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)'
        ).run(username, email, passwordHash, displayName || username);

        const user = { id: result.lastInsertRowid, username };
        const token = generateToken(user);

        res.status(201).json({
            user: { id: user.id, username, email, displayName: displayName || username },
            token,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'username and password are required' });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({ id: user.id, username: user.username });

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.display_name,
                bio: user.bio,
            },
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/auth/me
 * Returns current user info (requires auth)
 */
router.get('/me', (req, res) => {
    const { requireAuth } = require('../auth');
    requireAuth(req, res, () => {
        const db = getDb();
        const user = db.prepare('SELECT id, username, email, display_name, bio, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    });
});

module.exports = router;
