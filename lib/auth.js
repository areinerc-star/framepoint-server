// lib/auth.js
const ADMIN_PASS = process.env.ADMIN_PASS || 'framepoint2026';

// Returns true (and sends the 401) if the request is NOT authorized.
// Call: if (unauthorized(req, res)) return;
export function unauthorized(req, res) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token === ADMIN_PASS) return false;
  res.status(401).json({ error: 'Unauthorized' });
  return true;
}
