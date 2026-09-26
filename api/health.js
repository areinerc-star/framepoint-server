// api/health.js  →  GET https://your-project.vercel.app/api/health
// Note: on Vercel there's no long-running process, so "uptime" always
// reads ~0 — that's expected and not a bug. Use this endpoint just to
// confirm the deployment is reachable, not to track how long it's "been up."
export default function handler(req, res) {
  res.json({ status: 'ok' });
}
