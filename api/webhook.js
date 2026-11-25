// api/webhook.js - SIMPLE - ADMIN @jogja_lend
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@indo_fess";
const ADMIN_BASE = "@jogja_lend";
const MOD_BASE = "@siverif";
const ADMIN_ID = 123456789;

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}
async function getSql() {
  try { if (!process.env.DATABASE_URL) return null; const { neon } = await import('@neondatabase/serverless'); return neon(process.env.DATABASE_URL); } catch (e) { return null; }
}
async function getUser(sql, from) {
  const fallback = { id: from.id, chat_id: from.id, username: from.username || '-', name: from.first_name, first_name: from.first_name, sex: '-', birth: '-', location: '-', interest: '-', coinfes: 1000, unlimited_until: null, join_time: '-', step: null };
  if (!sql) return fallback;
  try {
    let rows = await sql`SELECT * FROM users WHERE chat_id = ${from.id}`;
    if (rows.length === 0) {
      const join = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      await sql`INSERT INTO users (chat_id, username, first_name, join_time, coinfes) VALUES (${from.id}, ${from.username || '-'}, ${from.first_name}, ${join}, 1000)`;
      rows = await sql`SELECT * FROM users WHERE chat_id = ${from.id}`;
    }
    let r = rows[0]; r.id = r.chat_id; r.name = r.first_name; r.coinfes = r.coinfes ?? 1000;
    return r;
  } catch (e) { return fallback; }
}
function isUnlimited(u) { return u.unlimited_until && new Date(u.unlimited_until) > new Date(); }
function profileText(u) {
  const unl = isUnlimited(u) ? `Aktif s/d ${new Date(u.unlimited_until).toLocaleDateString('id-ID')}` : 'Off';
  return `👋 <b>Selamat Datang di IndoFess!</b>\n\nKirim menfess anonim ! 👇\n\n👤 <b>${u.first_name || '-'}</b>\n🆔 <code>${u.chat_id || u.id}</code>\n🎂 Birth : ${u.birth || '-'}\n📍 Location : ${u.location || '-'}\n⚧️ Sex : ${u.sex || '-'}\n\n🪙 Coinfes : <b>${u.coinfes ?? 1000}</b>\n♾️ Unlimited : ${unl}\n🔗 Join : ${u.join_time || '-'}\n\n👑 Admin : @jogja_lend\n🚨 Mod : @siverif`;
}
function mainMenu() {
  return { inline_keyboard: [
    [{ text: "✍️ Kirim Menfess", callback_data: "kirim" }],
    [{ text: "👤 Profile", callback_data: "profile" }, { text: "⚙️ Setting", callback_data: "setting" }],
    [{ text: "🪙 Beli Coinfes", callback_data: "beli" }],
    [{ text: "❓ Bantuan", callback_data: "bantuan" }]
  ]};
}
async function autoDelete(chat_id, message_id, isStart) { if (isStart) return; try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){} }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  try {
    const sql = await getSql(); const update = req.body;
    if (update.callback_query) {
      const cb = update.callback_query; const chat_id = cb.message.chat.id; const message_id = cb.message.message_id;
      const u = await getUser(sql, cb.from); await tg('answerCallbackQuery', { callback_query_id: cb.id }); const d = cb.data;
      async function edit(text, markup) { let r = await tg('editMessageText', { chat_id, message_id, text, parse_mode: 'HTML', reply_markup: markup || mainMenu() }); if (!r.ok) { try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){} await tg('sendMessage', { chat_id, text, parse_mode: 'HTML', reply_markup: markup || mainMenu() }); } }
      async function fresh(text) { try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){} await tg('sendMessage', { chat_id, text, parse_mode: 'HTML' }); }
      if (d === 'profile') await edit(profileText(u));
      if (d === 'setting') await edit("<b>⚙️ Setting</b>\n\nPilih yang mau diubah:", { inline_keyboard: [[{ text: "Sex", callback_data: "set_sex" }, { text: "Birth", callback_data: "set_birth" }],[{ text: "Location", callback_data: "set_loc" }, { text: "Interest", callback_data: "set_interest" }],[{ text: "⬅️ Kembali", callback_data: "back" }]] });
      if (d === 'set_sex') { if(sql) try{ await sql`UPDATE users SET step='sex' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Sex: <b>M / F</b>"); }
      if (d === 'set_birth') { if(sql) try{ await sql`UPDATE users SET step='birth' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Birth: <b>Agustus 2002</b>"); }
      if (d === 'set_loc') { if(sql) try{ await sql`UPDATE users SET step='location' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Location: <b>Yogyakarta</b>"); }
      if (d === 'set_interest') { if(sql) try{ await sql`UPDATE users SET step='interest' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Interest: <b>M / F / All</b>"); }
      if (d === 'kirim') { if(sql) try{ await sql`UPDATE users SET step='kirim' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh(isUnlimited(u) ? "Kirim menfess kamu sekarang.\n\n♾️ Unlimited, gratis." : `Kirim menfess kamu sekarang.\n\n🪙 Coinfes: <b>${u.coinfes ?? 1000}</b> | 1 Post = 200`); }
      if (d === 'beli') await edit("<b>🪙 Beli Coinfes</b>\n\n2.000 Coinfes - Rp 10.000\n20.000 Coinfes - Rp 50.000\nUnlimited 2 Bulan - Rp 100.000\n\nKirim bukti ke @jogja_lend", { inline_keyboard: [[{ text: "💬 Chat Admin", url: "https://t.me/jogja_lend" }],[{ text: "⬅️ Kembali", callback_data: "back" }]] });
      if (d === 'bantuan') await edit("<b>❓ Bantuan</b>\n\n1. Klik Kirim Menfess\n2. Kirim menfess\n3. Auto ke-post di @indo_fess\n\n1 Post = 200 Coinfes");
      if (d === 'back') await edit(profileText(u));
      if (d === 'stop_kirim') { if(sql) try{ await sql`UPDATE users SET step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){} await edit(profileText(u)); }
      return res.status(200).json({ ok: true });
    }
    const msg = update.message; if (!msg) return res.status(200).json({ ok: true });
    const chat_id = msg.chat.id; const u = await getUser(sql, msg.from); const text = msg.text || msg.caption || ""; const isStart = text === '/start';
    if (text.startsWith('/unlimited') && msg.from.id === ADMIN_ID) {
      const targetId = text.split(' ')[1];
      if (sql) try { await sql`UPDATE users SET unlimited_until = CASE WHEN unlimited_until IS NULL OR unlimited_until < NOW() THEN NOW() + INTERVAL '60 days' ELSE unlimited_until + INTERVAL '60 days' END WHERE chat_id=${targetId}`; await tg('sendMessage', { chat_id: targetId, text: `🎉 <b>Unlimited Aktif!</b>\n\n♾️ Unlimited 2 Bulan aktif.\nGak perlu bayar Coinfes lagi.`, parse_mode: 'HTML', reply_markup: mainMenu() }); await tg('sendMessage', { chat_id, text: `✅ Unlimited 60 hari buat ${targetId}` }); } catch(e){}
      await autoDelete(chat_id, msg.message_id, false); return res.status(200).json({ ok: true });
    }
    if (text.startsWith('/add') && msg.from.id === ADMIN_ID) {
      const parts = text.split(' '); const targetId = parts[1]; const jumlah = parseInt(parts[2] || '0');
      if (sql) try { await sql`UPDATE users SET coinfes=coinfes+${jumlah} WHERE chat_id=${targetId}`; await tg('sendMessage', { chat_id: targetId, text: `🪙 <b>+${jumlah} Coinfes masuk!</b>`, parse_mode: 'HTML', reply_markup: mainMenu() }); await tg('sendMessage', { chat_id, text: `✅ +${jumlah} ke ${targetId}` }); } catch(e){}
      await autoDelete(chat_id, msg.message_id, false); return res.status(200).json({ ok: true });
    }
    if (isStart) {
      if(sql) try{ await sql`UPDATE users SET step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){}
      await tg('sendMessage', { chat_id, text: profileText(u), parse_mode: 'HTML', reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    if (['sex','birth','location','interest'].includes(u.step)) {
      if(sql) try{ if(u.step==='sex') await sql`UPDATE users SET sex=${text}, step=NULL WHERE chat_id=${u.chat_id}`; if(u.step==='birth') await sql`UPDATE users SET birth=${text}, step=NULL WHERE chat_id=${u.chat_id}`; if(u.step==='location') await sql`UPDATE users SET location=${text}, step=NULL WHERE chat_id=${u.chat_id}`; if(u.step==='interest') await sql`UPDATE users SET interest=${text}, step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){}
      await autoDelete(chat_id, msg.message_id, false);
      await tg('sendMessage', { chat_id, text: "✅ Disimpan.", parse_mode: 'HTML', reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    if (u.step !== 'kirim') {
      if (text.startsWith('/')) return res.status(200).json({ ok: true });
      await autoDelete(chat_id, msg.message_id, false);
      await tg('sendMessage', { chat_id, text: "Klik dulu <b>Kirim Menfess</b>.", parse_mode: 'HTML', reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }
    const unlimited = isUnlimited(u);
    if (!unlimited && (u.coinfes ?? 0) < 200) {
      await autoDelete(chat_id, msg.message_id, false);
      await tg('sendMessage', { chat_id, text: `❌ <b>Coinfes Habis!</b>\n\nCoinfes: <b>${u.coinfes ?? 0}</b>\nButuh 200 buat 1 post.`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "🪙 Beli Coinfes", callback_data: "beli" }]] });
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
      let sisa = u.coinfes ?? 1000;
      if (sql) try { if (!unlimited) { await sql`UPDATE users SET coinfes=coinfes-200, step='kirim' WHERE chat_id=${u.chat_id}`; sisa = sisa - 200; } else { await sql`UPDATE users SET step='kirim' WHERE chat_id=${u.chat_id}`; } await sql`INSERT INTO menfess (user_id, content, type) VALUES (${u.chat_id}, ${text || '[Media]'}, ${type})`; } catch (e) {}
      await autoDelete(chat_id, msg.message_id, false);
      await tg('sendMessage', { chat_id, text: `✅ <b>Terkirim!</b>\n\n${unlimited ? '♾️ Unlimited - Gratis' : `🪙 Sisa: <b>${sisa}</b>`}`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "👀 Lihat di Channel", url: "https://t.me/indo_fess" }],[{ text: "🛑 Berhenti", callback_data: "stop_kirim" }]] });
    }
    return res.status(200).json({ ok: true });
  } catch (e) { console.log(e); return res.status(200).json({ ok: true }); }
                                                                                                                                   }
