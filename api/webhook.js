const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID || "@indo_fess";

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const update = req.body;
    const msg = update.message;
    if (!msg) return res.status(200).json({ ok: true });

    const chat_id = msg.chat.id;
    const text = msg.text || msg.caption || "";

    if (text === '/start') {
      await tg('sendMessage', { chat_id, text: `Halo! 👋\n\nKirim menfess kamu langsung ke sini.\nMenfess langsung auto ke-post di ${CHANNEL_ID}.` });
      return res.status(200).json({ ok: true });
    }

    let content_type = 'text';
    let file_id = null;

    if (msg.photo) {
      content_type = 'photo';
      file_id = msg.photo[msg.photo.length - 1].file_id;
    } else if (msg.video) {
      content_type = 'video';
      file_id = msg.video.file_id;
    } else if (msg.animation) {
      content_type = 'video';
      file_id = msg.animation.file_id;
    } else if (!text) {
      await tg('sendMessage', { chat_id, text: "Kirim teks / foto / video ya!" });
      return res.status(200).json({ ok: true });
    }

    const caption = content_type === 'text' ? `${text}\n\n— via @indo_fess` : `${text ? text + "\n\n" : ""}— via @indo_fess`;

    let result;
    if (content_type === 'text') {
      result = await tg('sendMessage', { chat_id: CHANNEL_ID, text: caption });
    } else if (content_type === 'photo') {
      result = await tg('sendPhoto', { chat_id: CHANNEL_ID, photo: file_id, caption });
    } else if (content_type === 'video') {
      result = await tg('sendVideo', { chat_id: CHANNEL_ID, video: file_id, caption });
    }

    if (result && result.ok) {
      await tg('sendMessage', { chat_id, text: `✅ Menfess kamu udah ke-post di ${CHANNEL_ID}!` });
    } else {
      await tg('sendMessage', { chat_id, text: `❌ Gagal ke-post.\nError: ${result?.description || 'unknown'}\n\nCek: Bot udah jadi admin di ${CHANNEL_ID} belum?` });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.log("Error:", e);
    return res.status(200).json({ ok: true });
  }
}
