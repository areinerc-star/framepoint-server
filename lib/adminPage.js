// lib/adminPage.js
// Unchanged from the Railway version — the little HTML "Approved!" /
// "Denied" / "Not Found" cards shown when someone clicks the email link.
export function adminPage(title, message, success) {
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

export function denyFormPage(id, b) {
  return `<!DOCTYPE html>
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
  <form method="POST" action="/api/deny/${id}">
    <label>Reason for Denial</label>
    <textarea name="reason" placeholder="e.g. The requested date is already fully booked..."></textarea>
    <button type="submit">✗ Send Denial Email</button>
  </form>
</div>
</body></html>`;
}
