// lib/kv.js
// Storage layer — replaces the old bookings.json file with Vercel's KV / Upstash Redis
import { createClient } from '@vercel/kv';

const url = process.env.KV_REST_API_URL || 
            process.env.UPSTASH_REDIS_REST_URL || 
            process.env.STORAGE_REST_API_URL || 
            process.env.KV_URL ||
            process.env.STORAGE_URL;

const token = process.env.KV_REST_API_TOKEN || 
              process.env.UPSTASH_REDIS_REST_TOKEN || 
              process.env.STORAGE_REST_API_TOKEN;

export const kv = (url && token) 
  ? createClient({ url, token })
  : {
      // Emergency fallback if database env vars are completely unlinked
      async set() {},
      async get() { return null; },
      async sadd() {},
      async srem() {},
      async del() {},
      async smembers() { return []; }
    };

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
