// api/admin/stats.js  →  GET /api/admin/stats
import { applyCors } from '../../lib/cors.js';
import { unauthorized } from '../../lib/auth.js';
import { listBookings } from '../../lib/kv.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (unauthorized(req, res)) return;

  const list = await listBookings();
  res.json({
    total: list.length,
    pending: list.filter((b) => b.status === 'pending').length,
    approved: list.filter((b) => b.status === 'approved').length,
    denied: list.filter((b) => b.status === 'denied').length,
  });
}
