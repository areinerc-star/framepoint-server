// lib/cors.js
// Every serverless function is isolated, so there's no single global
// app.use(cors()) anymore — each handler calls this once at the top.
// Returns true if the request was an OPTIONS preflight and has already
// been answered (in which case the caller should just `return`).
export function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
