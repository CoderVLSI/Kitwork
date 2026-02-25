const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kitwork-secret-key-change-in-production';
const JWT_EXPIRES = '7d';

/**
 * Generate a JWT token for a user.
 */
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

/**
 * Express middleware: require authentication.
 * Sets req.user = { id, username }
 */
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = header.slice(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Express middleware: optional authentication.
 * Sets req.user if token present, otherwise null.
 */
function optionalAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = header.slice(7);
    try {
        req.user = jwt.verify(token, JWT_SECRET);
    } catch {
        req.user = null;
    }
    next();
}

module.exports = { generateToken, requireAuth, optionalAuth, JWT_SECRET };
