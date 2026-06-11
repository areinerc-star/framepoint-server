require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-token'],
}));
app.options('*', cors());

const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, 'bookings.json');

function loadBookings() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(e) { console.error('Error loading bookings:', e); }
  return {};
}

function saveBookings(data) {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }
  catch(e) { console.error('Error saving bookings:', e); }
}

const bookings = loadBookings();
const MAKE_WEBHOOK = 'https://hook.us2.make.com/66idvdk88i8q4ss42hzacc754icb77wn';

async function triggerMake(payload) {
  const res = await fetch(MAKE_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Make webhook error: ' + await res.text());
}

function adminPage(title, message, success) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,sans-serif;background:#1c1c1e;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.card{background:#2a2a2a;border-radius:20px;padding:40px 32px;max-width:440px;width:100%;text-align:center;border:1px solid #3a3a3c;}
.icon{margin-bottom:20px;}
.icon svg{width:64px;height:64px;}
h2{font-size:20px;color:#ffffff;margin-bottom:10px;letter-spacing:1px;}
p{font-size:14px;color:#aeaeb2;line-height:1.6;}
strong{color:#ffffff;}
.gold-line{width:40px;height:2px;background:#b89a5a;margin:0 auto 20px;}
</style></head>
<body>
<div class="card">
  <div class="icon">
    ${success ? `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="none" stroke="#b89a5a" stroke-width="2"/>
      <path d="M20 32 L28 40 L44 24" fill="none" stroke="#b89a5a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>` : `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="none" stroke="#e8b4b4" stroke-width="2"/>
      <path d="M22 22 L42 42 M42 22 L22 42" fill="none" stroke="#e8b4b4" stroke-width="3" stroke-linecap="round"/>
    </svg>`}
  </div>
  <div class="gold-line"></div>
  <h2>${title}</h2>
  <p>${message}</p>
</div>
</body></html>`;
}

// POST /booking — client submits booking
// Sends to Make.com: type, to, firstName, lastName, date, time, occasion,
// phone, email, city, venue, address, duration, startTime, endTime, approveUrl, denyUrl
app.post('/booking', async (req, res) => {
  try {
    const b = req.body;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    bookings[id] = { ...b, id, status: 'pending', submittedAt: new Date().toISOString() };
    saveBookings(bookings);
    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
    const approveUrl = `${baseUrl}/approve/${id}`;
    const denyUrl    = `${baseUrl}/deny-page/${id}`;
    await triggerMake({
      type:       'new_booking',
      to:         process.env.BUSINESS_EMAIL,
      firstName:  b.firstName,
      lastName:   b.lastName,
      date:       b.date,
      time:       b.time,
      occasion:   b.occasion,
      phone:      b.phone,
      email:      b.email,
      city:       b.city,
      venue:      b.venue || '',
      address:    b.address || '',
      duration:   b.duration || '02:00',
      startTime:  b.startTime || '',
      endTime:    b.endTime || '',
      approveUrl,
      denyUrl,
    });
    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/approve/:id', async (req, res) => {
  const b = bookings[req.params.id];
  if (!b) return res.send(adminPage('Not Found', 'This booking request was not found.', false));
  if (b.status !== 'pending') return res.send(adminPage('Already Processed', `This booking was already marked as <strong>${b.status}</strong>.`, false));
  b.status = 'approved';
  saveBookings(bookings);

  let calUrl = '';
  try {
    const dateStr = b.date;
    const timeStr = b.time || '';
    const times = timeStr.split(/[-–]/);
    const startTime = times[0] ? times[0].trim() : '09:00 AM';
    const endTime   = times[1] ? times[1].trim() : '10:00 AM';
    const toISO = (d, t) => {
      const dt = new Date(`${d} ${t}`);
      return dt.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
    };
    const start = toISO(dateStr, startTime);
    const end   = toISO(dateStr, endTime);
    const title = encodeURIComponent(`Photography Session — Frame-Point`);
    const details = encodeURIComponent(`Confirmed session\nOccasion: ${b.occasion}\nLocation: ${b.city}`);
    const location = encodeURIComponent(b.city || '');
    calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  } catch(e) { calUrl = 'https://calendar.google.com'; }

  try {
    await triggerMake({
      type:      'approved',
      to:        b.email,
      firstName: b.firstName,
      lastName:  b.lastName,
      date:      b.date,
      time:      b.time,
      occasion:  b.occasion,
      city:      b.city,
      duration:  b.duration || '02:00',
      startTime: b.startTime || '',
      endTime:   b.endTime || '',
      calUrl,
    });
    res.send(adminPage('Booking Approved', `Confirmation email sent to <strong>${b.email}</strong>.<br><br><strong>${b.firstName} ${b.lastName}</strong> — ${b.date} at ${b.time}`, true));
  } catch (err) {
    res.send(adminPage('Email Error', err.message, false));
  }
});

app.get('/deny-page/:id', (req, res) => {
  const b = bookings[req.params.id];
  if (!b) return res.send(adminPage('Not Found', 'Booking not found.', false));
  if (b.status !== 'pending') return res.send(adminPage('Already Processed', `This booking was already marked as <strong>${b.status}</strong>.`, false));

  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deny Booking — Frame-Point</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;background:#1c1c1e;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
  .card{background:#2a2a2a;border-radius:20px;padding:32px;max-width:500px;width:100%;border:1px solid #3a3a3c;}
  .logo{text-align:center;margin-bottom:8px;}
  .gold-line{width:40px;height:2px;background:#b89a5a;margin:10px auto 20px;}
  h2{font-size:20px;color:#ffffff;text-align:center;margin-bottom:6px;letter-spacing:1px;}
  .sub{font-size:13px;color:#aeaeb2;margin-bottom:20px;text-align:center;}
  .info{background:#1c1c1e;border-radius:10px;padding:14px 16px;margin-bottom:20px;font-size:13px;color:#ffffff;line-height:1.8;border:1px solid #3a3a3c;}
  .info span{color:#aeaeb2;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;}
  label{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#aeaeb2;display:block;margin-bottom:6px;}
  textarea{width:100%;padding:10px 12px;border:1px solid #3a3a3c;border-radius:8px;font-size:13px;font-family:Arial,sans-serif;min-height:100px;outline:none;resize:vertical;background:#1c1c1e;color:#ffffff;}
  textarea:focus{border-color:#b89a5a;}
  button{width:100%;padding:13px;background:#b89a5a;color:#1c1c1e;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;margin-top:14px;letter-spacing:1px;}
  button:hover{background:#f0e6cc;}
</style></head>
<body>
<div class="card">
  <div class="logo">
    <svg width="36" height="42" viewBox="-90 -110 180 210" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,-90 C-45,-90 -72,-55 -72,-22 C-72,18 -40,55 0,90 C40,55 72,18 72,-22 C72,-55 45,-90 0,-90 Z" fill="none" stroke="#b89a5a" stroke-width="3"/>
      <circle cx="0" cy="-22" r="48" fill="none" stroke="#b89a5a" stroke-width="2.5"/>
      <circle cx="0" cy="-22" r="28" fill="none" stroke="#b89a5a" stroke-width="1.5"/>
      <path d="M0,-18 C5,-10 6,0 3,6 C1,9 -1,9 -3,6 C-6,0 -5,-10 0,-18Z" fill="#b89a5a" transform="translate(0,-22) rotate(0)"/>
      <path d="M0,-18 C5,-10 6,0 3,6 C1,9 -1,9 -3,6 C-6,0 -5,-10 0,-18Z" fill="#b89a5a" transform="translate(0,-22) rotate(60)"/>
      <path d="M0,-18 C5,-10 6,0 3,6 C1,9 -1,9 -3,6 C-6,0 -5,-10 0,-18Z" fill="#b89a5a" transform="translate(0,-22) rotate(120)"/>
      <path d="M0,-18 C5,-10 6,0 3,6 C1,9 -1,9 -3,6 C-6,0 -5,-10 0,-18Z" fill="#b89a5a" transform="translate(0,-22) rotate(180)"/>
      <path d="M0,-18 C5,-10 6,0 3,6 C1,9 -1,9 -3,6 C-6,0 -5,-10 0,-18Z" fill="#b89a5a" transform="translate(0,-22) rotate(240)"/>
      <path d="M0,-18 C5,-10 6,0 3,6 C1,9 -1,9 -3,6 C-6,0 -5,-10 0,-18Z" fill="#b89a5a" transform="translate(0,-22) rotate(300)"/>
      <circle cx="0" cy="-22" r="5" fill="#b89a5a"/>
      <circle cx="0" cy="-22" r="2.5" fill="#2a2a2a"/>
    </svg>
    <div class="gold-line"></div>
  </div>
  <h2>Deny Booking Request</h2>
  <p class="sub">Provide a reason — it will be included in the client's email.</p>
  <div class="info">
    <span>Client</span>${b.firstName} ${b.lastName}<br>
    <span style="margin-top:8px;">Date & Time</span>${b.date} at ${b.time}<br>
    <span style="margin-top:8px;">Occasion</span>${b.occasion}
  </div>
  <form method="POST" action="/deny/${req.params.id}">
    <label>Reason for Denial</label>
    <textarea name="reason" placeholder="e.g. The requested date is already fully booked..."></textarea>
    <button type="submit">✗ Send Denial Email</button>
  </form>
</div>
</body></html>`);
});

app.use(express.urlencoded({ extended: true }));
app.post('/deny/:id', async (req, res) => {
  const b = bookings[req.params.id];
  if (!b) return res.send(adminPage('Not Found', 'Booking not found.', false));
  b.status = 'denied';
  saveBookings(bookings);
  const reason = req.body.reason || 'The requested date is unavailable.';
  try {
    await triggerMake({
      type: 'denied', to: b.email,
      firstName: b.firstName, lastName: b.lastName,
      date: b.date, time: b.time, occasion: b.occasion, city: b.city, reason,
    });
    res.send(adminPage('Denial Sent', `Denial email sent to <strong>${b.email}</strong>.`, true));
  } catch (err) {
    res.send(adminPage('Email Error', err.message, false));
  }
});

const ADMIN_PASS = process.env.ADMIN_PASS || 'framepoint2026';

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token === ADMIN_PASS) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

app.get('/admin/bookings', adminAuth, (req, res) => {
  const list = Object.values(bookings).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json(list);
});

app.get('/admin/stats', adminAuth, (req, res) => {
  const list = Object.values(bookings);
  res.json({
    total: list.length,
    pending: list.filter(b => b.status === 'pending').length,
    approved: list.filter(b => b.status === 'approved').length,
    denied: list.filter(b => b.status === 'denied').length,
  });
});

app.post('/admin/approve/:id', adminAuth, async (req, res) => {
  const b = bookings[req.params.id];
  if (!b) return res.status(404).json({ error: 'Not found' });
  if (b.status !== 'pending') return res.status(400).json({ error: 'Already processed' });
  b.status = 'approved';
  saveBookings(bookings);
  try {
    await triggerMake({
      type: 'approved', to: b.email,
      firstName: b.firstName, lastName: b.lastName,
      date: b.date, time: b.time, occasion: b.occasion, city: b.city,
      duration: b.duration || '02:00', startTime: b.startTime || '', endTime: b.endTime || '',
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/deny/:id', adminAuth, async (req, res) => {
  const b = bookings[req.params.id];
  if (!b) return res.status(404).json({ error: 'Not found' });
  if (b.status !== 'pending') return res.status(400).json({ error: 'Already processed' });
  b.status = 'denied';
  saveBookings(bookings);
  const reason = req.body.reason || 'The requested date is unavailable.';
  try {
    await triggerMake({
      type: 'denied', to: b.email,
      firstName: b.firstName, lastName: b.lastName,
      date: b.date, time: b.time, occasion: b.occasion, city: b.city, reason,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/booking/:id', adminAuth, (req, res) => {
  const id = req.params.id;
  if (!bookings[id]) return res.status(404).json({ error: 'Not found' });
  delete bookings[id];
  saveBookings(bookings);
  res.json({ success: true });
});

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Frame-Point server running on port ${PORT}`);
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    setInterval(() => { fetch(baseUrl + '/health').catch(() => {}); }, 4 * 60 * 1000);
  }
});
