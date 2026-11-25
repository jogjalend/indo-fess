import { sql } from '../lib/db.js';
export default async function handler(req, res) {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM menfess ORDER BY created_at DESC LIMIT 100`;
    return res.status(200).json(rows);
  }
  if (req.method === 'POST') {
    const { id, action } = req.body;
    await sql`UPDATE menfess SET status=${action === 'acc' ? 'posted' : 'rejected'} WHERE id=${id}`;
    return res.status(200).json({ ok: true });
  }
}
