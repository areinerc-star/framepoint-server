# Moving from Railway → Vercel

## What changed
- The old single `server.js` (Express) is now one small file per route,
  inside `/api`. Vercel turns each file into its own serverless function
  automatically — no router setup needed.
- `bookings.json` (a file on disk) is replaced by **Vercel KV** (Redis via
  the Upstash Marketplace integration). Serverless functions can't save
  files permanently, so this was required, not optional.
- CORS and admin-token checking used to be global Express middleware.
  Now each function calls two tiny shared helpers
  (`lib/cors.js`, `lib/auth.js`) at the top of its handler.
- Everything else — the Make.com webhook payloads, the approve/deny
  email-link flow, the admin dashboard API shape — is unchanged.

## Old URL → New URL
| Old (Railway)              | New (Vercel)                     |
|-----------------------------|-----------------------------------|
| `POST /booking`              | `POST /api/booking`               |
| `GET /approve/:id`           | `GET /api/approve/:id`            |
| `GET /deny-page/:id`         | `GET /api/deny-page/:id`          |
| `POST /deny/:id`             | `POST /api/deny/:id`              |
| `GET /health`                | `GET /api/health`                 |
| `GET /admin/bookings`        | `GET /api/admin/bookings`         |
| `GET /admin/stats`           | `GET /api/admin/stats`            |
| `POST /admin/approve/:id`    | `POST /api/admin/approve/:id`     |
| `POST /admin/deny/:id`       | `POST /api/admin/deny/:id`        |
| `DELETE /admin/booking/:id`  | `DELETE /api/admin/booking/:id`   |

**Update your frontend:** in your booking page's `<script>`, change
`SERVER_URL` to your new Vercel domain, and change every
`fetch(SERVER_URL + '/booking')` style call to
`fetch(SERVER_URL + '/api/booking')` (note the added `/api`).

## Setup steps
1. Commit this folder's contents into the **existing**
   `areinerc-star/framepoint-server` repo (replacing `server.js`).
   Delete the old `server.js` — it's fully replaced by `/api/*.js`.
2. Push to GitHub.
3. On vercel.com → **Add New Project** → import `framepoint-server`.
   Vercel auto-detects the `/api` folder; no build settings needed.
4. Go to the project's **Storage** tab → **Create Database** →
   pick a **Redis** option from the Marketplace (Upstash) → connect it
   to this project. This auto-injects `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` for you.
5. Go to **Settings → Environment Variables** and add the rest from
   `.env.example` (`BUSINESS_EMAIL`, `BASE_URL`, `ADMIN_PASS`).
6. Redeploy (Deployments tab → ⋯ on the latest one → Redeploy) so the
   new env vars are picked up.
7. Update `SERVER_URL` in your booking page and republish it.
8. Test: submit a real booking → confirm the Make.com email fires →
   click the Approve link in the email → confirm the confirmation
   email goes out too.

## Notes
- `GMAIL_USER` / `GMAIL_PASS` / `RESEND_API_KEY` from the old Railway
  variables aren't used anywhere in `server.js` — they were probably
  read inside your Make.com scenario, not the server itself. You can
  leave your Make scenario exactly as-is; nothing about the webhook
  payload shape changed.
- There is no more "keep-alive ping" needed (the old
  `setInterval(...fetch(baseUrl + '/health')...)` in `server.js`).
  Serverless functions don't need warming — they just run per request.
