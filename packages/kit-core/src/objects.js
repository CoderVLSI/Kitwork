const crypto = require('crypto');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { findKitRoot } = require('./repo');

/**
 * Hash content with SHA-256 and store as a compressed object.
 * Object format: "<type> <size>\0<content>"
 * Stored at: .kit/objects/<first2>/<rest>
 *
 * @param {string|Buffer} content - raw content
 * @param {'blob'|'tree'|'commit'} type - object type
 * @param {string} [kitDir] - path to .kit directory (auto-detected if omitted)
 * @returns {string} the SHA-256 hash
 */
function hashObject(content, type = 'blob', kitDir = null) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
  const header = `${type} ${buf.length}\0`;
  const store = Buffer.concat([Buffer.from(header, 'utf-8'), buf]);

  const hash = crypto.createHash('sha256').update(store).digest('hex');

  if (kitDir === null) {
    kitDir = path.join(findKitRoot(), '.kit');
  }

  const objDir = path.join(kitDir, 'objects', hash.slice(0, 2));
  const objPath = path.join(objDir, hash.slice(2));

  if (!fs.existsSync(objPath)) {
    fs.mkdirSync(objDir, { recursive: true });
    const compressed = zlib.deflateSync(store);
    fs.writeFileSync(objPath, compressed);
  }

  return hash;
}

/**
 * Read an object from the store by its hash.
 *
 * @param {string} hash - SHA-256 hash
 * @param {string} [kitDir] - path to .kit directory
 * @returns {{ type: string, content: Buffer }}
 */
function readObject(hash, kitDir = null) {
  if (kitDir === null) {
    kitDir = path.join(findKitRoot(), '.kit');
  }

  const objPath = path.join(kitDir, 'objects', hash.slice(0, 2), hash.slice(2));

  if (!fs.existsSync(objPath)) {
    throw new Error(`Object not found: ${hash}`);
  }

  const compressed = fs.readFileSync(objPath);
  const store = zlib.inflateSync(compressed);

  // Parse header: "<type> <size>\0<content>"
  const nullIndex = store.indexOf(0);
  const headerStr = store.slice(0, nullIndex).toString('utf-8');
  const [type] = headerStr.split(' ');
  const content = store.slice(nullIndex + 1);

  return { type, content };
}

/**
 * Check if an object exists in the store.
 * @param {string} hash
 * @param {string} [kitDir]
 * @returns {boolean}
 */
function objectExists(hash, kitDir = null) {
  if (kitDir === null) {
    kitDir = path.join(findKitRoot(), '.kit');
  }
  const objPath = path.join(kitDir, 'objects', hash.slice(0, 2), hash.slice(2));
  return fs.existsSync(objPath);
}

module.exports = { hashObject, readObject, objectExists };
