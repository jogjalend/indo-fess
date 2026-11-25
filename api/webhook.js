// TANPA import neon di atas! Biar gak crash lagi
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@indo_fess";
const ADMIN_BASE = "@carebian_5";
const MOD_BASE = "@mommods";
const ADMIN_ID = 123456789; // GANTI PAKE ID KAMU

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
  const fallback = { id: from.id, username: from.username || '-', name: from.first_name, sex: '-', birth: '-', location: '-', interest: '-', score: 100, coin: 20, coin_special: 0, kuota: 1, safe: false, join_time: '-', step: null };
  if (!sql) return fallback;
  try {
    let rows = await sql`SELECT * FROM users WHERE id = ${from.id}`;
    if (rows.length === 0) {
      const join = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      await sql`INSERT INTO users (id, username, name, join_time) VALUES (${from.id}, ${from.username || '-'}, ${from.first_name}, ${join})`;
      rows = await sql`SELECT * FROM users WHERE id = ${from.id}`;
    }
    return rows[0];
  } catch (e) { console.log("DB error:", e.message); return fallback; }
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
    const sql = await getSql();
    const update = req.body;

    if (update.callback_query) {
      const cb = update.callback_query;
      const chat_id = cb.message.chat.id;
      const u = await getUser(sql, cb.from);
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      const d = cb.data;
      if (d === 'profile') await tg('sendMessage', { chat_id, text: profileText(u), reply_markup: mainMenu() });
      if (d === 'setting') await tg('sendMessage', { chat_id, text: "⚙️ Setting:", reply_markup: { inline_keyboard: [[{ text: "⚧ Sex", callback_data: "set_sex" }, { text: "🎬 Birth", callback_data: "set_birth" }],[{ text: "📍 Location", callback_data: "set_loc" }, { text: "👀 Interest", callback_data: "set_interest" }],[{ text: "⬅️ Kembali", callback_data: "back" }]] }});
      if (d === 'set_sex') { if(sql) try{ await sql`UPDATE users SET step='sex' WHERE id=${u.id}`; }catch(e){} await tg('sendMessage', { chat_id, text: "Kirim Sex: M / F" }); }
      if (d === 'set_birth') { if(sql) try{ await sql`UPDATE users SET step='birth' WHERE id=${u.id}`; }catch(e){} await tg('sendMessage', { chat_id, text: "Kirim Birth: Agustus 2002" }); }
      if (d === 'set_loc') { if(sql) try{ await sql`UPDATE users SET step='location' WHERE id=${u.id}`; }catch(e){} await tg('sendMessage', { chat_id, text: "Kirim Location: Yogyakarta" }); }
      if (d === 'set_interest') { if(sql) try{ await sql`UPDATE users SET step='interest' WHERE id=${u.id}`; }catch(e){} await tg('sendMessage', { chat_id, text: "Kirim Interest: M / F / All" }); }
      if (d === 'kirim') { if(sql) try{ await sql`UPDATE users SET step='kirim' WHERE id=${u.id}`; }catch(e){} await tg('sendMessage', { chat_id, text: "✉️ Kirim menfess kamu sekarang (teks / foto / video)." }); }
      if (d === 'riwayat') { let list="Belum ada."; if(sql){ try{ const r=await sql`SELECT content FROM menfess WHERE user_id=${u.id} ORDER BY id DESC LIMIT 5`; if(r.length) list=r.map((x,i)=>`${i+1}. ${x.content?.slice(0,60)}`).join("\n"); }catch(e){} } await tg('sendMessage', { chat_id, text: `⏳ Riwayat:\n\n${list}`, reply_markup: mainMenu() }); }
      if (d === 'beli') await tg('sendMessage', { chat_id, text: "💎 Beli Coin\n10 Coin = 5k\n50 Coin = 20k\n100 Coin = 35k\nChat Admin: @carebian_5", reply_markup: mainMenu() });
      if (d === 'bantuan') await tg('sendMessage', { chat_id, text: "❓ Bantuan\n1. Klik Kirim ➤\n2. Kirim menfess\n3. Auto ke-post", reply_markup: mainMenu() });
      if (d === 'peraturan') await tg('sendMessage', { chat_id, text: "📜 Peraturan @indo_fess\n1. No SARA & porn\n2. No doxxing\n3. No spam\nLanggar = Ban!", reply_markup: mainMenu() });
      if (d === 'kritik') { if(sql) try{ await sql`UPDATE users SET step='kritik' WHERE id=${u.id}`; }catch(e){} await tg('sendMessage', { chat_id, text: "🪶 Kirim Kritik / Saran kamu." }); }
      if (d === 'back') await tg('sendMessage', { chat_id, text: profileText(u), reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }

    const msg = update.message;
    if (!msg) return res.status(200).json({ ok: true });
    const chat_id = msg.chat.id;
    const u = await getUser(sql, msg.from);
    const text = msg.text || msg.caption || "";

    if (text === '/start') {
      if(sql) try{ await sql`UPDATE users SET step=NULL WHERE id=${u.id}`; }catch(e){}
      await tg('sendMessage', { chat_id, text: profileText(u), reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    if (['sex','birth','location','interest'].includes(u.step)) {
      if(sql) try{ if(u.step==='sex') await sql`UPDATE users SET sex=${text}, step=NULL WHERE id=${u.id}`; if(u.step==='birth') await sql`UPDATE users SET birth=${text}, step=NULL WHERE id=${u.id}`; if(u.step==='location') await sql`UPDATE users SET location=${text}, step=NULL WHERE id=${u.id}`; if(u.step==='interest') await sql`UPDATE users SET interest=${text}, step=NULL WHERE id=${u.id}`; }catch(e){}
      const nu = await getUser(sql, msg.from);
      await tg('sendMessage', { chat_id, text: "✅ Disimpan!", reply_markup: mainMenu() });
      await tg('sendMessage', { chat_id, text: profileText(nu), reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    if (u.step === 'kritik') {
      if(sql) try{ await sql`UPDATE users SET step=NULL WHERE id=${u.id}`; }catch(e){}
      await tg('sendMessage', { chat_id: ADMIN_ID, text: `📩 Kritik dari @${u.username}:\n\n${text}` });
      await tg('sendMessage', { chat_id, text: "✅ Kritik diteruskan.", reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    // Menfess
    let file_id=null, type='text';
    if (msg.photo) { type='photo'; file_id=msg.photo[msg.photo.length-1].file_id; }
    if (msg.video) { type='video'; file_id=msg.video.file_id; }
    if (!text && type==='text') return res.status(200).json({ ok: true });
    const caption = type==='text' ? `${text}\n\n— via @indo_fess` : `${text ? text+"\n\n" : ""}— via @indo_fess`;
    let result;
    if (type==='text') result = await tg('sendMessage', { chat_id: CHANNEL_ID, text: caption });
    if (type==='photo') result = await tg('sendPhoto', { chat_id: CHANNEL_ID, photo: file_id, caption });
    if (type==='video') result = await tg('sendVideo', { chat_id: CHANNEL_ID, video: file_id, caption });
    if (result?.ok) {
      if(sql) try{ if(u.kuota>0) await sql`UPDATE users SET kuota=kuota-1, step=NULL WHERE id=${u.id}`; else await sql`UPDATE users SET coin=coin-1, step=NULL WHERE id=${u.id}`; await sql`INSERT INTO menfess (user_id, content, type) VALUES (${u.id}, ${text || '[Media]'}, ${type})`; }catch(e){}
      await tg('sendMessage', { chat_id, text: `✅ Menfess ke-post di @indo_fess!`, reply_markup: mainMenu() });
    } else {
      await tg('sendMessage', { chat_id, text: `❌ Gagal post: ${result?.description}` });
    }
    return res.status(200).json({ ok: true });
  } catch (e) { console.log(e); return res.status(200).json({ ok: true }); }
                                                                                                                                                                                                                    }
