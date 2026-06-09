require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ── In-memory booking store (replace with DB later if needed)
const bookings = {};

// ── Email transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,   // your Gmail
    pass: process.env.GMAIL_PASS,   // Gmail App Password
  },
});

// ── Brand colors (used in email templates)
const BRAND = {
  charcoal: '#1c1c1e',
  gold:     '#b89a5a',
  goldLight:'#f0e6cc',
  surface:  '#f9f7f4',
};

// ── LOGO SVG (inline, safe for email clients)
const LOGO_SVG = `
<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 8px;">
  <tr>
    <td valign="middle" style="padding-right:10px;">
      <svg width="32" height="38" viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
        <path d="M100,10 C55,10 28,45 28,78 C28,118 60,158 100,195 C140,158 172,118 172,78 C172,45 145,10 100,10Z" fill="none" stroke="#1c1c1e" stroke-width="6"/>
        <circle cx="100" cy="88" r="48" fill="none" stroke="#1c1c1e" stroke-width="5"/>
        <circle cx="100" cy="88" r="28" fill="none" stroke="#1c1c1e" stroke-width="3"/>
        <path d="M100,70 C105,78 106,88 103,94 C101,97 99,97 97,94 C94,88 95,78 100,70Z" fill="#1c1c1e" transform="rotate(0,100,88)"/>
        <path d="M100,70 C105,78 106,88 103,94 C101,97 99,97 97,94 C94,88 95,78 100,70Z" fill="#1c1c1e" transform="rotate(60,100,88)"/>
        <path d="M100,70 C105,78 106,88 103,94 C101,97 99,97 97,94 C94,88 95,78 100,70Z" fill="#1c1c1e" transform="rotate(120,100,88)"/>
        <path d="M100,70 C105,78 106,88 103,94 C101,97 99,97 97,94 C94,88 95,78 100,70Z" fill="#1c1c1e" transform="rotate(180,100,88)"/>
        <path d="M100,70 C105,78 106,88 103,94 C101,97 99,97 97,94 C94,88 95,78 100,70Z" fill="#1c1c1e" transform="rotate(240,100,88)"/>
        <path d="M100,70 C105,78 106,88 103,94 C101,97 99,97 97,94 C94,88 95,78 100,70Z" fill="#1c1c1e" transform="rotate(300,100,88)"/>
        <circle cx="100" cy="88" r="8" fill="#1c1c1e"/>
        <circle cx="100" cy="88" r="4" fill="white"/>
      </svg>
    </td>
    <td valign="middle">
      <div style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#1c1c1e;letter-spacing:2px;line-height:1.2;">FRAME-POINT</div>
      <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:400;color:#b89a5a;letter-spacing:3px;">PHOTOGRAPHY</div>
    </td>
  </tr>
</table>`;

// ════════════════════════════════════════════════
// EMAIL TEMPLATES
// ════════════════════════════════════════════════

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f7f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f7f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <!-- Header -->
      <tr><td style="background:#1c1c1e;padding:24px 32px;text-align:center;">
        ${LOGO_SVG.replace(/stroke="#1c1c1e"/g, 'stroke="white"').replace(/fill="#1c1c1e"/g, 'fill="white"').replace(/color:#1c1c1e/g, 'color:white').replace(/color:#b89a5a/g, 'color:#b89a5a')}
      </td></tr>
      <!-- Gold bar -->
      <tr><td style="height:3px;background:linear-gradient(90deg,#b89a5a,#f0e6cc,#b89a5a);"></td></tr>
      <!-- Body -->
      <tr><td style="padding:32px;">
        ${content}
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#1c1c1e;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#6e6e73;letter-spacing:1px;">FRAME-POINT PHOTOGRAPHY</p>
        <p style="margin:6px 0 0;font-size:11px;color:#3a3a3c;">© ${new Date().getFullYear()} All rights reserved</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// 1. Business notification email (to photographer team)
function buildBusinessEmail(b, approveUrl, denyUrl) {
  return emailWrapper(`
    <h2 style="margin:0 0 4px;font-size:22px;color:#1c1c1e;font-family:Georgia,serif;">New Booking Request</h2>
    <div style="width:40px;height:2px;background:#b89a5a;margin-bottom:20px;"></div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">Client Name</span><br>
        <strong style="font-size:14px;color:#1c1c1e;">${b.firstName} ${b.lastName}</strong>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">Session Date</span><br>
        <strong style="font-size:14px;color:#1c1c1e;">${b.date}</strong>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">Time</span><br>
        <strong style="font-size:14px;color:#1c1c1e;">${b.time}</strong>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">Occasion</span><br>
        <strong style="font-size:14px;color:#1c1c1e;">${b.occasion}</strong>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">Event Location</span><br>
        <strong style="font-size:14px;color:#1c1c1e;">${b.venue ? b.venue + ', ' : ''}${b.address ? b.address + ', ' : ''}${b.city}</strong>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">Phone</span><br>
        <strong style="font-size:14px;color:#1c1c1e;">${b.phone}</strong>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">Email</span><br>
        <strong style="font-size:14px;color:#1c1c1e;">${b.email}</strong>
      </td></tr>
    </table>

    <p style="font-size:13px;color:#6e6e73;margin-bottom:20px;">Please review and respond to this booking request using the buttons below:</p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td width="48%" style="padding-right:8px;">
          <a href="${approveUrl}" style="display:block;text-align:center;background:#1c1c1e;color:#ffffff;text-decoration:none;padding:14px;border-radius:8px;font-size:14px;font-weight:bold;letter-spacing:1px;">✓ APPROVE</a>
        </td>
        <td width="48%" style="padding-left:8px;">
          <a href="${denyUrl}" style="display:block;text-align:center;background:#faeaea;color:#a83232;text-decoration:none;padding:14px;border-radius:8px;font-size:14px;font-weight:bold;letter-spacing:1px;border:1px solid #e8b4b4;">✗ DENY</a>
        </td>
      </tr>
    </table>

    <p style="font-size:11px;color:#aeaeb2;margin-top:20px;text-align:center;">
      This request was submitted on ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (PHT)
    </p>
  `);
}

// 2. Approval email (to client)
function buildApprovalEmail(b) {
  return emailWrapper(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:56px;height:56px;background:#eaf4ee;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="font-size:26px;">✓</span>
      </div>
      <h2 style="margin:0 0 4px;font-size:24px;color:#1c1c1e;font-family:Georgia,serif;">Your Session is Confirmed!</h2>
      <div style="width:40px;height:2px;background:#b89a5a;margin:8px auto 0;"></div>
    </div>

    <p style="font-size:14px;color:#6e6e73;line-height:1.7;margin-bottom:20px;">
      Dear <strong style="color:#1c1c1e;">${b.firstName}</strong>,<br><br>
      We're thrilled to confirm your photography session with <strong style="color:#1c1c1e;">Frame-Point Photography</strong>. We can't wait to capture your special moments!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f4;border-radius:10px;padding:20px;margin-bottom:20px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">📅 Date</span><br>
        <strong style="font-size:15px;color:#1c1c1e;">${b.date}</strong>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">🕐 Time</span><br>
        <strong style="font-size:15px;color:#1c1c1e;">${b.time}</strong>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">🎉 Occasion</span><br>
        <strong style="font-size:15px;color:#1c1c1e;">${b.occasion}</strong>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">📍 Location</span><br>
        <strong style="font-size:15px;color:#1c1c1e;">${b.venue ? b.venue + ', ' : ''}${b.address ? b.address + ', ' : ''}${b.city}</strong>
      </td></tr>
    </table>

    <div style="background:#f0e6cc;border-left:3px solid #b89a5a;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#8a6f38;line-height:1.6;">
        📸 <strong>What's next?</strong> Our team will reach out to discuss the details of your session, including shot lists, outfits, and any special requests. Please keep this email as your reference.
      </p>
    </div>

    <p style="font-size:13px;color:#6e6e73;line-height:1.7;">
      Should you have any questions or need to make changes, feel free to reply to this email. We look forward to seeing you!
    </p>

    <p style="font-size:14px;color:#1c1c1e;margin-top:20px;">
      Warm regards,<br>
      <strong>The Frame-Point Photography Team</strong>
    </p>
  `);
}

// 3. Denial email (to client)
function buildDenialEmail(b, reason) {
  return emailWrapper(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:56px;height:56px;background:#faeaea;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="font-size:26px;">✗</span>
      </div>
      <h2 style="margin:0 0 4px;font-size:24px;color:#1c1c1e;font-family:Georgia,serif;">Booking Request Update</h2>
      <div style="width:40px;height:2px;background:#b89a5a;margin:8px auto 0;"></div>
    </div>

    <p style="font-size:14px;color:#6e6e73;line-height:1.7;margin-bottom:20px;">
      Dear <strong style="color:#1c1c1e;">${b.firstName}</strong>,<br><br>
      Thank you for your interest in booking a session with <strong style="color:#1c1c1e;">Frame-Point Photography</strong>. Unfortunately, we are unable to accommodate your request for the following reason:
    </p>

    <div style="background:#faeaea;border-left:3px solid #e8b4b4;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#a83232;line-height:1.6;">
        ${reason || 'The requested date and time is no longer available.'}
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f4;border-radius:10px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:6px 0;border-bottom:1px solid #e5e0d8;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">Requested Date</span><br>
        <strong style="font-size:14px;color:#1c1c1e;">${b.date} at ${b.time}</strong>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <span style="font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:1px;">Occasion</span><br>
        <strong style="font-size:14px;color:#1c1c1e;">${b.occasion}</strong>
      </td></tr>
    </table>

    <div style="background:#f0e6cc;border-left:3px solid #b89a5a;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#8a6f38;line-height:1.6;">
        💛 We'd love to find another date that works for you! Please visit our booking page to check available dates and submit a new request. We value your interest and hope to work with you soon.
      </p>
    </div>

    <p style="font-size:14px;color:#1c1c1e;margin-top:20px;">
      With appreciation,<br>
      <strong>The Frame-Point Photography Team</strong>
    </p>
  `);
}

// ════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════

// POST /booking — client submits booking
app.post('/booking', async (req, res) => {
  try {
    const b = req.body;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    bookings[id] = { ...b, id, status: 'pending', submittedAt: new Date().toISOString() };

    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
    const approveUrl = `${baseUrl}/approve/${id}`;
    const denyUrl    = `${baseUrl}/deny-page/${id}`;

    // Email to business
    await transporter.sendMail({
      from: `"Frame-Point Booking" <${process.env.GMAIL_USER}>`,
      to:   process.env.BUSINESS_EMAIL,
      subject: `📸 New Booking Request — ${b.firstName} ${b.lastName} | ${b.date}`,
      html: buildBusinessEmail(b, approveUrl, denyUrl),
    });

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /approve/:id — team clicks Approve in email
app.get('/approve/:id', async (req, res) => {
  const b = bookings[req.params.id];
  if (!b) return res.send(adminPage('Not Found', 'This booking request was not found or has already been processed.', false));
  if (b.status !== 'pending') return res.send(adminPage('Already Processed', `This booking was already marked as <strong>${b.status}</strong>.`, false));

  b.status = 'approved';

  try {
    await transporter.sendMail({
      from: `"Frame-Point Photography" <${process.env.GMAIL_USER}>`,
      to:   b.email,
      subject: `✅ Your Session is Confirmed — Frame-Point Photography`,
      html: buildApprovalEmail(b),
    });
    res.send(adminPage('Booking Approved ✓', `Confirmation email sent to <strong>${b.email}</strong>.<br><br>
      <strong>${b.firstName} ${b.lastName}</strong> — ${b.date} at ${b.time}`, true));
  } catch (err) {
    res.send(adminPage('Email Error', err.message, false));
  }
});

// GET /deny-page/:id — team clicks Deny in email → shows reason form
app.get('/deny-page/:id', (req, res) => {
  const b = bookings[req.params.id];
  if (!b) return res.send(adminPage('Not Found', 'Booking not found.', false));
  if (b.status !== 'pending') return res.send(adminPage('Already Processed', `This booking was already marked as <strong>${b.status}</strong>.`, false));

  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deny Booking — Frame-Point</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;background:#f9f7f4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
  .card{background:#fff;border-radius:16px;padding:32px;max-width:500px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.07);border-top:3px solid #b89a5a;}
  h2{font-size:20px;color:#1c1c1e;margin-bottom:6px;}
  .sub{font-size:13px;color:#6e6e73;margin-bottom:20px;}
  .info{background:#f9f7f4;border-radius:8px;padding:12px 14px;margin-bottom:20px;font-size:13px;color:#1c1c1e;line-height:1.6;}
  label{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#6e6e73;display:block;margin-bottom:6px;}
  textarea{width:100%;padding:10px 12px;border:1px solid #e5e0d8;border-radius:8px;font-size:13px;font-family:Arial,sans-serif;min-height:100px;outline:none;resize:vertical;}
  textarea:focus{border-color:#b89a5a;}
  button{width:100%;padding:13px;background:#1c1c1e;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;margin-top:14px;letter-spacing:1px;}
  button:hover{background:#3a3a3c;}
</style></head>
<body>
<div class="card">
  <h2>Deny Booking Request</h2>
  <p class="sub">Please provide a reason — it will be included in the email to the client.</p>
  <div class="info">
    <strong>${b.firstName} ${b.lastName}</strong><br>
    ${b.date} at ${b.time}<br>
    ${b.occasion}
  </div>
  <form method="POST" action="/deny/${req.params.id}">
    <label>Reason for Denial</label>
    <textarea name="reason" placeholder="e.g. The requested date is already fully booked. We apologize for the inconvenience..."></textarea>
    <button type="submit">✗ Send Denial Email</button>
  </form>
</div>
</body></html>`);
});

// POST /deny/:id — submit denial reason
app.use(express.urlencoded({ extended: true }));
app.post('/deny/:id', async (req, res) => {
  const b = bookings[req.params.id];
  if (!b) return res.send(adminPage('Not Found', 'Booking not found.', false));

  b.status = 'denied';
  const reason = req.body.reason || 'The requested date is unavailable.';

  try {
    await transporter.sendMail({
      from: `"Frame-Point Photography" <${process.env.GMAIL_USER}>`,
      to:   b.email,
      subject: `📋 Booking Request Update — Frame-Point Photography`,
      html: buildDenialEmail(b, reason),
    });
    res.send(adminPage('Denial Sent ✓', `Denial email with reason sent to <strong>${b.email}</strong>.`, true));
  } catch (err) {
    res.send(adminPage('Email Error', err.message, false));
  }
});

// Helper: simple admin response page
function adminPage(title, message, success) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;background:#f9f7f4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.card{background:#fff;border-radius:16px;padding:32px;max-width:440px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.07);border-top:3px solid ${success ? '#b89a5a' : '#e8b4b4'};}
.icon{font-size:40px;margin-bottom:14px;}h2{font-size:20px;color:#1c1c1e;margin-bottom:10px;}p{font-size:14px;color:#6e6e73;line-height:1.6;}</style></head>
<body><div class="card"><div class="icon">${success ? '✅' : '❌'}</div><h2>${title}</h2><p>${message}</p></div></body></html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Frame-Point server running on port ${PORT}`));
