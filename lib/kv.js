// lib/kv.js
// Storage layer — replaces the old bookings.json file with Vercel's KV
// (Redis, via the Upstash Marketplace integration). Same shape of data,
// just persisted properly instead of on a serverless function's disk.
import { kv } from '@vercel/kv';

const INDEX_KEY = 'booking:ids';

export async function saveBooking(id, data) {
  await kv.set(`booking:${id}`, data);
  await kv.sadd(INDEX_KEY, id);
  return data;
}

export async function getBooking(id) {
  return (await kv.get(`booking:${id}`)) || null;
}

export async function updateBooking(id, patch) {
  const existing = await getBooking(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await kv.set(`booking:${id}`, updated);
  return updated;
}

export async function deleteBooking(id) {
  await kv.del(`booking:${id}`);
  await kv.srem(INDEX_KEY, id);
}

export async function listBookings() {
  const ids = await kv.smembers(INDEX_KEY);
  if (!ids || !ids.length) return [];
  const all = await Promise.all(ids.map((id) => kv.get(`booking:${id}`)));
  return all.filter(Boolean).sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
