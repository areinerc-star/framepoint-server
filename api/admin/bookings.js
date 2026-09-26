// api/admin/bookings.js  →  GET /api/admin/bookings  (needs x-admin-token header or ?token=)
import { applyCors } from '../../lib/cors.js';
import { unauthorized } from '../../lib/auth.js';
import { listBookings } from '../../lib/kv.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (unauthorized(req, res)) return;

  const list = await listBookings();
  res.json(list);
}
