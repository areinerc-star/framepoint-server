// lib/make.js
// Unchanged from the Railway version — still fires the same Make.com
// scenario, which is what actually sends your emails.
const MAKE_WEBHOOK =
  process.env.MAKE_WEBHOOK_URL ||
  'https://hook.us2.make.com/66idvdk88i8q4ss42hzacc754icb77wn';

export async function triggerMake(payload) {
  const res = await fetch(MAKE_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Make webhook error: ' + (await res.text()));
  }
}
