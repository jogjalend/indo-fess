export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  try {
    const update = req.body;
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const chat_id = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    if (chat_id && BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text: "✅ BOT HIDUP! Webhook udah bener. Sekarang tinggal pasang DB." })
      });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.log(e);
    return res.status(200).json({ ok: true });
  }
}
