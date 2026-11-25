import TelegramBot from 'node-telegram-bot-api';
import { sql } from '../lib/db.js';

const bot = new TelegramBot(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;
const CHANNEL_ID = process.env.CHANNEL_ID; // @indofess

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');
  const update = req.body;
  try {
    if (update.message && update.message.chat.id.toString() !== ADMIN_ID) {
      const msg = update.message;
      if (msg.text === '/start') {
        await bot.sendMessage(msg.chat.id, `Halo! Selamat datang di Menfess INDOFESS 💌\n\nKirim aja menfess kamu disini, bisa teks / foto / video.\n\nMenfess akan dicek admin dulu. Kalau di-ACC, langsung diposting ke @indofess.\n\nKetik /batal untuk batalin menfess terakhir yang pending.`);
        return res.status(200).send('OK');
      }
      if (msg.text === '/batal') {
        await sql`UPDATE menfess SET status='cancelled' WHERE user_id=${msg.from.id} AND status='pending'`;
        await bot.sendMessage(msg.chat.id, 'Menfess pending kamu sudah dibatalkan.');
        return res.status(200).send('OK');
      }

      const text = msg.text || msg.caption || '';
      const fileId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : msg.video?.file_id || msg.document?.file_id || null;
      const type = msg.photo ? 'photo' : msg.video ? 'video' : msg.document ? 'document' : 'text';

      const [row] = await sql`
        INSERT INTO menfess (user_id, username, telegram_message_id, content_type, content, file_id)
        VALUES (${msg.from.id}, ${msg.from.username || 'anon'}, ${msg.message_id}, ${type}, ${text}, ${fileId})
        RETURNING id`;

      await bot.sendMessage(ADMIN_ID, `📩 Menfess Baru #${row.id}\nDari: @${msg.from.username || msg.from.id}\nTipe: ${type}\n\n${text}`, {
        reply_markup: { inline_keyboard: [[
          { text: '✅ ACC & POST', callback_data: `acc_${row.id}` },
          { text: '❌ TOLAK', callback_data: `tolak_${row.id}` }
        ]]}
      });
      await bot.sendMessage(msg.chat.id, `Menfess #${row.id} terkirim! Tunggu admin ACC ya ✨`);
    }

    if (update.callback_query) {
      const q = update.callback_query;
      const [action, id] = q.data.split('_');
      const [data] = await sql`SELECT * FROM menfess WHERE id = ${id}`;
      if (!data) return res.status(200).send('OK');

      if (action === 'acc') {
        const caption = data.content ? `${data.content}\n\n— via @indofess` : `— via @indofess`;
        if (data.content_type === 'photo') await bot.sendPhoto(CHANNEL_ID, data.file_id, { caption });
        else if (data.content_type === 'video') await bot.sendVideo(CHANNEL_ID, data.file_id, { caption });
        else if (data.content_type === 'document') await bot.sendDocument(CHANNEL_ID, data.file_id, { caption });
        else await bot.sendMessage(CHANNEL_ID, caption);

        await sql`UPDATE menfess SET status='posted' WHERE id=${id}`;
        await bot.sendMessage(data.user_id, `Yeay! Menfess #${id} kamu sudah diposting di @indofess 🥳`);
        await bot.editMessageText(`Menfess #${id} ✅ DIPOSTING`, { chat_id: ADMIN_ID, message_id: q.message.message_id });
      } else {
        await sql`UPDATE menfess SET status='rejected' WHERE id=${id}`;
        await bot.sendMessage(data.user_id, `Maaf, menfess #${id} kamu belum bisa diposting 🙏`);
        await bot.editMessageText(`Menfess #${id} ❌ DITOLAK`, { chat_id: ADMIN_ID, message_id: q.message.message_id });
      }
    }
  } catch (e) { console.error(e); }
  res.status(200).send('OK');
}
