const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repos');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Large limit for push payloads

// ─── Health check ───
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'kitwork-server', version: '1.0.0' });
});

// ─── Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);

// ─── Error handler ───
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ───
app.listen(PORT, () => {
    console.log(`\n  🧰 Kitwork Server running on http://localhost:${PORT}`);
    console.log(`  📡 API: http://localhost:${PORT}/api`);
    console.log(`  💾 Data: ${path.join(__dirname, '..', 'data')}\n`);
});

module.exports = app;
