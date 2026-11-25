// api/webhook.js - FINAL FIX BUAT TABEL chat_id
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@indo_fess";
const ADMIN_BASE = "@carebian_5";
const MOD_BASE = "@mommods";
const ADMIN_ID = 123456789;

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}
async function getSql() {
  try {
    if (!process.env.DATABASE_URL) return null;
    const { neon } = await import('@neondatabase/serverless');
    return neon(process.env.DATABASE_URL);
  } catch (e) { console.log("Neon fail:", e.message); return null; }
}

async function getUser(sql, from) {
  const fallback = { id: from.id, chat_id: from.id, username: from.username || '-', name: from.first_name, first_name: from.first_name, sex: '-', birth: '-', location: '-', interest: '-', score: 100, coin: 20, coin_special: 0, kuota: 1, safe: false, join_time: '-', step: null };
  if (!sql) return fallback;
  try {
    let rows = await sql`SELECT * FROM users WHERE chat_id = ${from.id}`;
    if (rows.length === 0) {
      const join = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      await sql`INSERT INTO users (chat_id, username, first_name, join_time) VALUES (${from.id}, ${from.username || '-'}, ${from.first_name}, ${join})`;
      rows = await sql`SELECT * FROM users WHERE chat_id = ${from.id}`;
    }
    const r = rows[0];
    // Samain nama biar profileText gak error
    r.id = r.chat_id;
    r.name = r.first_name;
    return r;
  } catch (e) { console.log("DB error:", e.message); return fallback; }
}

function profileText(u) {
  return `⚧ Sex : ${u.sex || '-'}\n🎬 Birth : ${u.birth || '-'}\n📍 Location : ${u.location || '-'}\n👀 Interest in : ${u.interest || '-'}\n\n⚡ Score : ${u.score ?? 100}\n💰 Coin : ${u.coin ?? 20}/24H | 💰 Coin Special : ${u.coin_special ?? 0}\n💔 Free kuota Interaksi : ${u.kuota ?? 1}x Interaksi/Menfess\n🎗 Safe Sender ${u.safe ? '✅' : '❌'}\n\n🆔 ID : ${u.chat_id || u.id}\n🌐 Link : indofess_bot.t.me?start=_${u.username}\n🔗 Join time : ${u.join_time || '-'}\n\n🏠 Channel Base : ${CHANNEL_ID}\n👑 Admin Base : ${ADMIN_BASE}\n🚨 Moderator Base : ${MOD_BASE}`;
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
    const sql = await getSql();
    const update = req.body;

    if (update.callback_query) {
      const cb = update.callback_query;
      const chat_id = cb.message.chat.id;
      const message_id = cb.message.message_id;
      const u = await getUser(sql, cb.from);
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      const d = cb.data;
      async function edit(text, markup) {
        const r = await tg('editMessageText', { chat_id, message_id, text, reply_markup: markup || mainMenu() });
        if (!r.ok) { try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){} await tg('sendMessage', { chat_id, text, reply_markup: markup || mainMenu() }); }
      }
      async function fresh(text) { try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){} await tg('sendMessage', { chat_id, text }); }
      if (d === 'profile') await edit(profileText(u));
      if (d === 'setting') await edit("⚙️ Setting:", { inline_keyboard: [[{ text: "⚧ Sex", callback_data: "set_sex" }, { text: "🎬 Birth", callback_data: "set_birth" }],[{ text: "📍 Location", callback_data: "set_loc" }, { text: "👀 Interest", callback_data: "set_interest" }],[{ text: "⬅️ Kembali", callback_data: "back" }]] });
      if (d === 'set_sex') { if(sql) try{ await sql`UPDATE users SET step='sex' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Sex: M / F"); }
      if (d === 'set_birth') { if(sql) try{ await sql`UPDATE users SET step='birth' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Birth: Agustus 2002"); }
      if (d === 'set_loc') { if(sql) try{ await sql`UPDATE users SET step='location' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Location: Yogyakarta"); }
      if (d === 'set_interest') { if(sql) try{ await sql`UPDATE users SET step='interest' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Interest: M / F / All"); }
      if (d === 'kirim') { if(sql) try{ await sql`UPDATE users SET step='kirim' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("✉️ Kirim menfess kamu sekarang (teks / foto / video)."); }
      if (d === 'riwayat') { let list="Belum ada."; if(sql){ try{ const r=await sql`SELECT content FROM menfess WHERE user_id=${u.chat_id} ORDER BY id DESC LIMIT 5`; if(r.length) list=r.map((x,i)=>`${i+1}. ${x.content?.slice(0,60)}`).join("\n"); }catch(e){} } await edit(`⏳ Riwayat:\n\n${list}`); }
      if (d === 'beli') await edit("💎 Beli Coin\n10 Coin = 5k\n50 Coin = 20k\n100 Coin = 35k\nChat Admin: @carebian_5");
      if (d === 'bantuan') await edit("❓ Bantuan\n1. Klik Kirim ➤\n2. Kirim menfess\n3. Auto ke-post");
      if (d === 'peraturan') await edit("📜 Peraturan @indo_fess\n1. No SARA & porn\n2. No doxxing\n3. No spam\nLanggar = Ban!");
      if (d === 'kritik') { if(sql) try{ await sql`UPDATE users SET step='kritik' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("🪶 Kirim Kritik / Saran kamu."); }
      if (d === 'back') await edit(profileText(u));
      return res.status(200).json({ ok: true });
    }

    const msg = update.message;
    if (!msg) return res.status(200).json({ ok: true });
    const chat_id = msg.chat.id;
    const u = await getUser(sql, msg.from);
    const text = msg.text || msg.caption || "";

    if (text === '/start') {
      if(sql) try{ await sql`UPDATE users SET step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){}
      try { await tg('deleteMessage', { chat_id, message_id: msg.message_id }); } catch(e){}
      await tg('sendMessage', { chat_id, text: profileText(u), reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    if (['sex','birth','location','interest'].includes(u.step)) {
      if(sql) try{ if(u.step==='sex') await sql`UPDATE users SET sex=${text}, step=NULL WHERE chat_id=${u.chat_id}`; if(u.step==='birth') await sql`UPDATE users SET birth=${text}, step=NULL WHERE chat_id=${u.chat_id}`; if(u.step==='location') await sql`UPDATE users SET location=${text}, step=NULL WHERE chat_id=${u.chat_id}`; if(u.step==='interest') await sql`UPDATE users SET interest=${text}, step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){}
      const nu = await getUser(sql, msg.from);
      try { await tg('deleteMessage', { chat_id, message_id: msg.message_id }); } catch(e){}
      await tg('sendMessage', { chat_id, text: "✅ Disimpan!", reply_markup: mainMenu() });
      await tg('sendMessage', { chat_id, text: profileText(nu), reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    if (u.step === 'kritik') {
      if(sql) try{ await sql`UPDATE users SET step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){}
      await tg('sendMessage', { chat_id: ADMIN_ID, text: `📩 Kritik dari @${u.username}:\n\n${text}` });
      try { await tg('deleteMessage', { chat_id, message_id: msg.message_id }); } catch(e){}
      await tg('sendMessage', { chat_id, text: "✅ Kritik diteruskan.", reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    if (u.step !== 'kirim') {
      if (text.startsWith('/')) return res.status(200).json({ ok: true });
      await tg('sendMessage', { chat_id, text: "Klik dulu tombol Kirim ➤ di bawah biar menfess kamu ke-post.", reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    let file_id = null, type = 'text';
    if (msg.photo) { type = 'photo'; file_id = msg.photo[msg.photo.length - 1].file_id; }
    if (msg.video) { type = 'video'; file_id = msg.video.file_id; }
    if (!text && type === 'text') return res.status(200).json({ ok: true });
    const caption = type === 'text' ? `${text}\n\n— via @indo_fess` : `${text ? text + "\n\n" : ""}— via @indo_fess`;
    let result;
    if (type === 'text') result = await tg('sendMessage', { chat_id: CHANNEL_ID, text: caption });
    if (type === 'photo') result = await tg('sendPhoto', { chat_id: CHANNEL_ID, photo: file_id, caption });
    if (type === 'video') result = await tg('sendVideo', { chat_id: CHANNEL_ID, video: file_id, caption });
    if (result?.ok) {
      if (sql) try {
        if (u.kuota > 0) await sql`UPDATE users SET kuota=kuota-1, step=NULL WHERE chat_id=${u.chat_id}`;
        else await sql`UPDATE users SET coin=coin-1, step=NULL WHERE chat_id=${u.chat_id}`;
        await sql`INSERT INTO menfess (user_id, content, type) VALUES (${u.chat_id}, ${text || '[Media]'}, ${type})`;
      } catch (e) { console.log("menfess save error:", e.message); }
      try { await tg('deleteMessage', { chat_id, message_id: msg.message_id }); } catch(e){}
      await tg('sendMessage', { chat_id, text: `✅ Menfess ke-post di @indo_fess!`, reply_markup: mainMenu() });
    } else {
      await tg('sendMessage', { chat_id, text: `❌ Gagal post: ${result?.description}` });
    }
    return res.status(200).json({ ok: true });
  } catch (e) { console.log(e); return res.status(200).json({ ok: true }); }
          }
