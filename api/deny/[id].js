// api/deny/[id].js  →  POST https://your-project.vercel.app/api/deny/:id
// Vercel's Node runtime auto-parses this form POST into req.body, same
// as express.urlencoded() did before — no extra setup needed.
import { getBooking, updateBooking } from '../../lib/kv.js';
import { triggerMake } from '../../lib/make.js';
import { adminPage } from '../../lib/adminPage.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  const b = await getBooking(id);
  if (!b) return res.send(adminPage('Not Found', 'Booking not found.', false));

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
    res.send(adminPage('Denial Sent', `Denial email sent to <strong>${b.email}</strong>.`, true));
  } catch (err) {
    res.send(adminPage('Email Error', err.message, false));
  }
}
