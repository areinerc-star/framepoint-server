// api/deny-page/[id].js  →  GET https://your-project.vercel.app/api/deny-page/:id
// Shows the "why are you denying this" form from the email link.
import { getBooking } from '../../lib/kv.js';
import { adminPage, denyFormPage } from '../../lib/adminPage.js';

export default async function handler(req, res) {
  const { id } = req.query;
  const b = await getBooking(id);

  if (!b) {
    return res.send(adminPage('Not Found', 'Booking not found.', false));
  }
  if (b.status !== 'pending') {
    return res.send(
      adminPage('Already Processed', `This booking was already marked as <strong>${b.status}</strong>.`, false)
    );
  }

  res.setHeader('Content-Type', 'text/html');
  res.send(denyFormPage(id, b));
}
