export default async function handler(req, res) {
  const hasUrl = !!process.env.DATABASE_URL;
  let dbTest = "belum dicoba";
  let stepCol = "belum dicoba";
  let users = [];
  try {
    if (!hasUrl) {
      dbTest = "DATABASE_URL KOSONG di Vercel!";
    } else {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);
      const r = await sql`SELECT 1 as ok`;
      dbTest = "KONEK! " + JSON.stringify(r);
      const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='users'`;
      stepCol = cols.map(c => c.column_name).join(", ");
      users = await sql`SELECT id, username, step FROM users ORDER BY id DESC LIMIT 3`;
    }
  } catch (e) {
    dbTest = "ERROR: " + e.message;
  }
  return res.status(200).json({ hasUrl, dbTest, columns: stepCol, users });
}
