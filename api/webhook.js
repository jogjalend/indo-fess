const { Pool } = require('pg');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; // @indo_fess
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function sendMessage(chat_id, text) {
  return tg('sendMessage', { chat_id, text, parse_mode: 'HTML' });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const update = req.body;
    const msg = update.message;
    if (!msg) return res.status(200).json({ ok: true });

    const chat_id = msg.chat.id;
    const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
    const user_id = msg.from.id;
    const text = msg.text || msg.caption || "";

    // /start
    if (text === '/start') {
      await sendMessage(chat_id, `Halo! 👋\n\nKirim menfess kamu langsung ke sini, teks / foto / video.\n\nMenfess langsung auto ke-post di ${CHANNEL_ID} tanpa nunggu admin.\n\nKetik aja menfessnya sekarang!`);
      return res.status(200).json({ ok: true });
    }

    // Tentukan tipe konten
    let content_type = 'text';
    let content = text;
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
      await sendMessage(chat_id, "Kirim teks / foto / video ya!");
      return res.status(200).json({ ok: true });
    }

    // Simpan ke DB
    try {
      await pool.query(
        `INSERT INTO menfess (user_id, username, content_type, content, file_id, status) VALUES ($1,$2,$3,$4,$5,'posted')`,
        [user_id, username, content_type, content, file_id]
      );
    } catch (e) { console.log("DB error:", e.message); }

    // AUTO POST KE CHANNEL
    const postCaption = content_type === 'text'
      ? `${content}\n\n— via @indo_fess`
      : `${content ? content + "\n\n" : ""}— via @indo_fess`;

    let result;
    if (content_type === 'text') {
      result = await tg('sendMessage', { chat_id: CHANNEL_ID, text: postCaption });
    } else if (content_type === 'photo') {
      result = await tg('sendPhoto', { chat_id: CHANNEL_ID, photo: file_id, caption: postCaption });
    } else if (content_type === 'video') {
      result = await tg('sendVideo', { chat_id: CHANNEL_ID, video: file_id, caption: postCaption });
    }

    if (result && result.ok) {
      await sendMessage(chat_id, `✅ Menfess kamu udah ke-post di ${CHANNEL_ID}!\n\nCek channelnya sekarang!`);
    } else {
      console.log("Gagal post:", result);
      await sendMessage(chat_id, `❌ Gagal ke-post. Bot belum jadi admin di ${CHANNEL_ID} / CHANNEL_ID salah.\n\nError: ${result?.description || 'unknown'}`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.log("Webhook error:", e);
    return res.status(200).json({ ok: true });
  }
};
