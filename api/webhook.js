import { neon } from '@neondatabase/serverless';

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@indo_fess";
const ADMIN_BASE = "@carebian_5";
const MOD_BASE = "@mommods";
const ADMIN_ID = 123456789; // <-- GANTI PAKE ID KAMU, chat @userinfobot

const sql = neon(process.env.DATABASE_URL);

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function getUser(from) {
  let rows = await sql`SELECT * FROM users WHERE id = ${from.id}`;
  if (rows.length === 0) {
    const join = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    await sql`INSERT INTO users (id, username, name, join_time) VALUES (${from.id}, ${from.username || '-'}, ${from.first_name}, ${join})`;
    rows = await sql`SELECT * FROM users WHERE id = ${from.id}`;
  }
  return rows[0];
}

function profileText(u) {
  return `⚧ Sex : ${u.sex}\n🎬 Birth : ${u.birth}\n📍 Location : ${u.location}\n👀 Interest in : ${u.interest}\n\n⚡ Score : ${u.score}\n💰 Coin : ${u.coin}/24H | 💰 Coin Special : ${u.coin_special}\n💔 Free kuota Interaksi : ${u.kuota}x Interaksi/Menfess\n🎗 Safe Sender ${u.safe ? '✅' : '❌'}\n\n🆔 ID : ${u.id}\n🌐 Link : indofess_bot.t.me?start=_${u.username}\n🔗 Join time : ${u.join_time}\n\n🏠 Channel Base : ${CHANNEL_ID}\n👑 Admin Base : ${ADMIN_BASE}\n🚨 Moderator Base : ${MOD_BASE}`;
}

function mainMenu() {
  return { inline_keyboard: [
    [{ text: "Kritik, Saran, Tanya, Lapor 🪶", callback_data: "kritik" }],
    [{ text: "Profile 👤", callback_data: "profile" }, { text: "Setting ⚙️", callback_data: "setting" }],
    [{ text: "Riwayat ⏳", callback_data: "riwayat" }, { text: "Beli 💎", callback_data: "beli" }],
    [{ text: "Bantuan ❓", callback_data: "bantuan" }, { text: "Peraturan 📜", callback_data: "peraturan" }],
    [{ text: "Kirim ➤", callback_data: "kirim" }]
  ]};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  try {
    const update = req.body;

    if (update.callback_query) {
      const cb = update.callback_query;
      const chat_id = cb.message.chat.id;
      const u = await getUser(cb.from);
      const data = cb.data;
      await tg('answerCallbackQuery', { callback_query_id: cb.id });

      if (data === 'profile') await tg('sendMessage', { chat_id, text: profileText(u), reply_markup: mainMenu() });
      if (data === 'setting') await tg('sendMessage', { chat_id, text: "⚙️ Setting\nPilih yang mau diubah:", reply_markup: { inline_keyboard: [
        [{ text: "⚧ Sex", callback_data: "set_sex" }, { text: "🎬 Birth", callback_data: "set_birth" }],
        [{ text: "📍 Location", callback_data: "set_loc" }, { text: "👀 Interest", callback_data: "set_interest" }],
        [{ text: "⬅️ Kembali", callback_data: "back" }]
      ]}});
      if (data === 'set_sex') { await sql`UPDATE users SET step='sex' WHERE id=${u.id}`; await tg('sendMessage', { chat_id, text: "Kirim Sex kamu: M / F" }); }
      if (data === 'set_birth') { await sql`UPDATE users SET step='birth' WHERE id=${u.id}`; await tg('sendMessage', { chat_id, text: "Kirim Birth, contoh: Agustus 2002" }); }
      if (data === 'set_loc') { await sql`UPDATE users SET step='location' WHERE id=${u.id}`; await tg('sendMessage', { chat_id, text: "Kirim Location, contoh: Yogyakarta" }); }
      if (data === 'set_interest') { await sql`UPDATE users SET step='interest' WHERE id=${u.id}`; await tg('sendMessage', { chat_id, text: "Kirim Interest: M / F / All" }); }
      if (data === 'kirim') { await sql`UPDATE users SET step='kirim' WHERE id=${u.id}`; await tg('sendMessage', { chat_id, text: "✉️ Kirim menfess kamu sekarang (teks / foto / video)." }); }
      if (data === 'riwayat') {
        const rows = await sql`SELECT content, created_at FROM menfess WHERE user_id=${u.id} ORDER BY id DESC LIMIT 5`;
        const list = rows.length ? rows.map((r,i)=>`${i+1}. ${r.content?.slice(0,60)}`).join("\n") : "Belum ada menfess.";
        await tg('sendMessage', { chat_id, text: `⏳ Riwayat Kamu:\n\n${list}`, reply_markup: mainMenu() });
      }
      if (data === 'beli') await tg('sendMessage', { chat_id, text: "💎 Beli Coin\n\n💰 10 Coin = 5k\n💰 50 Coin = 20k\n💰 100 Coin = 35k\n\nChat Admin: @carebian_5", reply_markup: mainMenu() });
      if (data === 'bantuan') await tg('sendMessage', { chat_id, text: "❓ Bantuan\n\n1. Klik Kirim ➤\n2. Kirim menfess\n3. Otomatis ke-post\n\nKendala? Chat @carebian_5", reply_markup: mainMenu() });
      if (data === 'peraturan') await tg('sendMessage', { chat_id, text: "📜 Peraturan @indo_fess\n\n1. Dilarang SARA & pornografi\n2. Dilarang doxxing\n3. Dilarang spam & promosi\n4. Admin berhak delete\n\nLanggar = Ban!", reply_markup: mainMenu() });
      if (data === 'kritik') { await sql`UPDATE users SET step='kritik' WHERE id=${u.id}`; await tg('sendMessage', { chat_id, text: "🪶 Kirim Kritik / Saran / Lapor kamu." }); }
      if (data === 'back') { const nu = await getUser(cb.from); await tg('sendMessage', { chat_id, text: profileText(nu), reply_markup: mainMenu() }); }
      return res.status(200).json({ ok: true });
    }

    const msg = update.message;
    if (!msg) return res.status(200).json({ ok: true });
    const chat_id = msg.chat.id;
    const u = await getUser(msg.from);
    const text = msg.text || msg.caption || "";

    if (text === '/start') {
      await sql`UPDATE users SET step=NULL WHERE id=${u.id}`;
      await tg('sendMessage', { chat_id, text: profileText(u), reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }

    // Isi Setting - SAVE KE NEON
    if (['sex','birth','location','interest'].includes(u.step)) {
      if (u.step === 'sex') await sql`UPDATE users SET sex=${text}, step=NULL WHERE id=${u.id}`;
      if (u.step === 'birth') await sql`UPDATE users SET birth=${text}, step=NULL WHERE id=${u.id}`;
      if (u.step === 'location') await sql`UPDATE users SET location=${text}, step=NULL WHERE id=${u.id}`;
      if (u.step === 'interest') await sql`UPDATE users SET interest=${text}, step=NULL WHERE id=${u.id}`;
      const nu = await getUser(msg.from);
      await tg('sendMessage', { chat_id, text: "✅ Disimpan ke database!", reply_markup: mainMenu() });
      await tg('sendMessage', { chat_id, text: profileText(nu), reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }

    if (u.step === 'kritik') {
      await sql`UPDATE users SET step=NULL WHERE id=${u.id}`;
      await tg('sendMessage', { chat_id: ADMIN_ID, text: `📩 Kritik dari @${u.username} (${u.id}):\n\n${text}` });
      await tg('sendMessage', { chat_id, text: "✅ Kritik udah diteruskan ke admin.", reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }

    // Kirim Menfess - SAVE + KURANGIN COIN
    if (u.step === 'kirim' || !u.step) {
      if (u.kuota <= 0 && u.coin <= 0) {
        await tg('sendMessage', { chat_id, text: "❌ Coin habis! Beli dulu di menu Beli 💎", reply_markup: mainMenu() });
        return res.status(200).json({ ok: true });
      }
      let file_id = null; let type = 'text';
      if (msg.photo) { type='photo'; file_id=msg.photo[msg.photo.length-1].file_id; }
      if (msg.video) { type='video'; file_id=msg.video.file_id; }
      if (!text && type==='text') { await tg('sendMessage', { chat_id, text: "Kirim teks / foto / video ya!" }); return res.status(200).json({ ok: true }); }

      const caption = type==='text' ? `${text}\n\n— via @indo_fess` : `${text ? text+"\n\n" : ""}— via @indo_fess`;
      let result;
      if (type==='text') result = await tg('sendMessage', { chat_id: CHANNEL_ID, text: caption });
      if (type==='photo') result = await tg('sendPhoto', { chat_id: CHANNEL_ID, photo: file_id, caption });
      if (type==='video') result = await tg('sendVideo', { chat_id: CHANNEL_ID, video: file_id, caption });

      if (result?.ok) {
        if (u.kuota > 0) await sql`UPDATE users SET kuota=kuota-1, step=NULL WHERE id=${u.id}`;
        else await sql`UPDATE users SET coin=coin-1, step=NULL WHERE id=${u.id}`;
        await sql`INSERT INTO menfess (user_id, content, type) VALUES (${u.id}, ${text || '[Media]'}, ${type})`;
        const nu = await getUser(msg.from);
        await tg('sendMessage', { chat_id, text: `✅ Menfess ke-post di @indo_fess!\nSisa: ${nu.kuota}x Free | 💰 ${nu.coin} Coin`, reply_markup: mainMenu() });
      } else {
        await tg('sendMessage', { chat_id, text: `❌ Gagal post: ${result?.description}` });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (e) { console.log(e); return res.status(200).json({ ok: true }); }
          }
