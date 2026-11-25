// api/webhook.js - TEST MINIMAL - TANPA DATABASE
const BOT_TOKEN = process.env.BOT_TOKEN;

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true, test: "webhook hidup" });
  try {
    const msg = req.body?.message;
    if (!msg) return res.status(200).json({ ok: true });
    await tg('sendMessage', { chat_id: msg.chat.id, text: "✅ BOT HIDUP! Webhook jalan.\n\nKetik /start lagi." });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.log("ERROR:", e);
    return res.status(200).json({ ok: true });
  }
}
