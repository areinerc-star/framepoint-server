// api/index.js → GET https://your-project.vercel.app/ or /api
export default function handler(req, res) {
  res.json({
    status: 'online',
    message: 'Framepoint Photography Booking API (Vercel Serverless)',
    endpoints: [
      'GET  /api/health',
      'POST /api/booking',
      'GET  /api/approve/:id',
      'GET  /api/deny-page/:id',
      'POST /api/deny/:id',
      'GET  /api/admin/bookings',
      'GET  /api/admin/stats',
      'POST /api/admin/approve/:id',
      'POST /api/admin/deny/:id',
      'DELETE /api/admin/booking/:id'
    ]
  });
}
