// api/approve/[id].js  →  GET https://your-project.vercel.app/api/approve/:id
// This is the link that gets clicked straight from the business owner's
// email inbox, so it must stay a plain GET link (no login screen).
import { getBooking, updateBooking } from '../../lib/kv.js';
import { triggerMake } from '../../lib/make.js';
import { adminPage } from '../../lib/adminPage.js';

export default async function handler(req, res) {
  const { id } = req.query;
  const b = await getBooking(id);

  if (!b) {
    return res.send(adminPage('Not Found', 'This booking request was not found.', false));
  }
  if (b.status !== 'pending') {
    return res.send(
      adminPage('Already Processed', `This booking was already marked as <strong>${b.status}</strong>.`, false)
    );
  }

  const updated = await updateBooking(id, { status: 'approved' });

  let calUrl = 'https://calendar.google.com';
  try {
    const timeStr = b.time || '';
    const times = timeStr.split(/[-–]/);
    const startTime = times[0] ? times[0].trim() : '09:00 AM';
    const endTime = times[1] ? times[1].trim() : '10:00 AM';
    const toISO = (d, t) => new Date(`${d} ${t}`).toISOString().slice(0, 19);
    const start = toISO(b.date, startTime);
    const end = toISO(b.date, endTime);
    const title = encodeURIComponent('Photography Session — Frame-Point');
    const details = encodeURIComponent(`Confirmed session\nOccasion: ${b.occasion}\nLocation: ${b.city}`);
    const location = encodeURIComponent(b.city || '');
    calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  } catch (e) {
    // keep the fallback calUrl
  }

  try {
    await triggerMake({
      type: 'approved',
      to: b.email,
      firstName: b.firstName,
      lastName: b.lastName,
      date: b.date,
      time: b.time,
      occasion: b.occasion,
      city: b.city,
      duration: b.duration || '02:00',
      startTime: b.startTime || '',
      endTime: b.endTime || '',
      calUrl,
    });
    res.send(
      adminPage(
        'Booking Approved',
        `Confirmation email sent to <strong>${b.email}</strong>.<br><br><strong>${b.firstName} ${b.lastName}</strong> — ${b.date} at ${b.time}`,
        true
      )
    );
  } catch (err) {
    res.send(adminPage('Email Error', err.message, false));
  }
}
