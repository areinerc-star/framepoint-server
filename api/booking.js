// api/booking.js  →  POST https://your-project.vercel.app/api/booking
// Same job as the old app.post('/booking', ...) in server.js.
import { applyCors } from '../lib/cors.js';
import { saveBooking, newId } from '../lib/kv.js';
import { triggerMake } from '../lib/make.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const b = req.body || {};
    const id = newId();

    await saveBooking(id, {
      ...b,
      id,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    });

    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
    const approveUrl = `${baseUrl}/api/approve/${id}`;
    const denyUrl = `${baseUrl}/api/deny-page/${id}`;

    await triggerMake({
      type: 'new_booking',
      to: process.env.BUSINESS_EMAIL,
      firstName: b.firstName,
      lastName: b.lastName,
      date: b.date,
      time: b.time,
      occasion: b.occasion,
      phone: b.phone,
      email: b.email,
      city: b.city,
      venue: b.venue || '',
      address: b.address || '',
      duration: b.duration || '02:00',
      startTime: b.startTime || '',
      endTime: b.endTime || '',
      approveUrl,
      denyUrl,
    });

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
