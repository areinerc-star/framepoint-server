// api/admin/deny/[id].js  →  POST /api/admin/deny/:id  (dashboard button, needs token)
import { applyCors } from '../../../lib/cors.js';
import { unauthorized } from '../../../lib/auth.js';
import { getBooking, updateBooking } from '../../../lib/kv.js';
import { triggerMake } from '../../../lib/make.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (unauthorized(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const b = await getBooking(id);
  if (!b) return res.status(404).json({ error: 'Not found' });
  if (b.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

  await updateBooking(id, { status: 'denied' });
  const reason = (req.body && req.body.reason) || 'The requested date is unavailable.';

  try {
    await triggerMake({
      type: 'denied',
      to: b.email,
      firstName: b.firstName,
      lastName: b.lastName,
      date: b.date,
      time: b.time,
      occasion: b.occasion,
      city: b.city,
      reason,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
