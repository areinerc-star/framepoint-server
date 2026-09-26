// api/admin/booking/[id].js  →  DELETE /api/admin/booking/:id  (dashboard "delete" button)
import { applyCors } from '../../../lib/cors.js';
import { unauthorized } from '../../../lib/auth.js';
import { getBooking, deleteBooking } from '../../../lib/kv.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (unauthorized(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const b = await getBooking(id);
  if (!b) return res.status(404).json({ error: 'Not found' });

  await deleteBooking(id);
  res.json({ success: true });
}
