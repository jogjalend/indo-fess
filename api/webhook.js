// api/webhook.js - FULLFIX TANPA NEON - DIJAMIN JALAN - ADMIN @jogja_lend
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@indo_fess";
const ADMIN_ID = 123456789; // GANTI ID TELEGRAM @jogja_lend

// Database sementara di memori (ganti Neon nanti kalau mau permanen)
if (!globalThis.DB) globalThis.DB = new Map();
const DB = globalThis.DB;

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

function getUser(from) {
  if (!DB.has(from.id)) {
    DB.set(from.id, {
      id: from.id, chat_id: from.id, username: from.username || '-',
      first_name: from.first_name, name: from.first_name,
      sex: '-', birth: '-', location: '-', interest: '-',
      coinfes: 1000, unlimited_until: null,
      join_time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      step: null
    });
  }
  let u = DB.get(from.id);
  u.first_name = from.first_name; // update nama kalau ganti
  return u;
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

async function autoDelete(chat_id, message_id, isStart) {
  if (isStart) return;
  try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){}
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  try {
    const update = req.body;

    if (update.callback_query) {
      const cb = update.callback_query;
      const chat_id = cb.message.chat.id;
      const message_id = cb.message.message_id;
      const u = getUser(cb.from);
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      const d = cb.data;
      async function edit(text, markup) {
        let r = await tg('editMessageText', { chat_id, message_id, text, parse_mode: 'HTML', reply_markup: markup || mainMenu() });
        if (!r.ok) { try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){} await tg('sendMessage', { chat_id, text, parse_mode: 'HTML', reply_markup: markup || mainMenu() }); }
      }
      async function fresh(text) { try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){} await tg('sendMessage', { chat_id, text, parse_mode: 'HTML' }); }
      if (d === 'profile') await edit(profileText(u));
      if (d === 'setting') await edit("<b>⚙️ Setting</b>\n\nPilih yang mau diubah:", { inline_keyboard: [[{ text: "Sex", callback_data: "set_sex" }, { text: "Birth", callback_data: "set_birth" }],[{ text: "Location", callback_data: "set_loc" }, { text: "Interest", callback_data: "set_interest" }],[{ text: "⬅️ Kembali", callback_data: "back" }]] });
      if (d === 'set_sex') { u.step='sex'; await fresh("Kirim Sex: <b>M / F</b>"); }
      if (d === 'set_birth') { u.step='birth'; await fresh("Kirim Birth: <b>Agustus 2002</b>"); }
      if (d === 'set_loc') { u.step='location'; await fresh("Kirim Location: <b>Yogyakarta</b>"); }
      if (d === 'set_interest') { u.step='interest'; await fresh("Kirim Interest: <b>M / F / All</b>"); }
      if (d === 'kirim') { u.step='kirim'; await fresh(isUnlimited(u) ? "Kirim menfess kamu sekarang.\n\n♾️ Unlimited, gratis." : `Kirim menfess kamu sekarang.\n\n🪙 Coinfes: <b>${u.coinfes ?? 1000}</b> | 1 Post = 200`); }
      if (d === 'beli') await edit("<b>🪙 Beli Coinfes</b>\n\n2.000 Coinfes - Rp 10.000\n20.000 Coinfes - Rp 50.000\nUnlimited 2 Bulan - Rp 100.000\n\nKirim bukti ke @jogja_lend", { inline_keyboard: [[{ text: "💬 Chat Admin", url: "https://t.me/jogja_lend" }],[{ text: "⬅️ Kembali", callback_data: "back" }]] });
      if (d === 'bantuan') await edit("<b>❓ Bantuan</b>\n\n1. Klik Kirim Menfess\n2. Kirim menfess\n3. Auto ke-post di @indo_fess\n\n1 Post = 200 Coinfes");
      if (d === 'back') await edit(profileText(u));
      if (d === 'stop_kirim') { u.step=null; await edit(profileText(u)); }
      return res.status(200).json({ ok: true });
    }

    const msg = update.message;
    if (!msg) return res.status(200).json({ ok: true });
    const chat_id = msg.chat.id;
    const u = getUser(msg.from);
    const text = msg.text || msg.caption || "";
    const isStart = text === '/start';

    if (text.startsWith('/unlimited') && msg.from.id === ADMIN_ID) {
      const targetId = text.split(' ')[1];
      if (!targetId) { await tg('sendMessage', { chat_id, text: "Cara: /unlimited 123456789" }); return res.status(200).json({ ok: true }); }
      const target = DB.get(Number(targetId)) || DB.get(targetId);
      if (target) {
        const now = new Date();
        const base = target.unlimited_until && new Date(target.unlimited_until) > now ? new Date(target.unlimited_until) : now;
        base.setDate(base.getDate() + 60);
        target.unlimited_until = base.toISOString();
        await tg('sendMessage', { chat_id: Number(targetId), text: `🎉 <b>Unlimited Aktif!</b>\n\n♾️ Unlimited 2 Bulan aktif.\nGak perlu bayar Coinfes lagi.`, parse_mode: 'HTML', reply_markup: mainMenu() });
        await tg('sendMessage', { chat_id, text: `✅ Unlimited 60 hari buat ${targetId}` });
      } else { await tg('sendMessage', { chat_id, text: `User ${targetId} belum pernah /start ke bot.` }); }
      await autoDelete(chat_id, msg.message_id, false);
      return res.status(200).json({ ok: true });
    }

    if (text.startsWith('/add') && msg.from.id === ADMIN_ID) {
      const parts = text.split(' ');
      const targetId = parts[1]; const jumlah = parseInt(parts[2] || '0');
      const target = DB.get(Number(targetId)) || DB.get(targetId);
      if (target) {
        target.coinfes = (target.coinfes || 0) + jumlah;
        await tg('sendMessage', { chat_id: Number(targetId), text: `🪙 <b>+${jumlah} Coinfes masuk!</b>`, parse_mode: 'HTML', reply_markup: mainMenu() });
        await tg('sendMessage', { chat_id, text: `✅ +${jumlah} ke ${targetId}` });
      } else { await tg('sendMessage', { chat_id, text: `User ${targetId} belum pernah /start.` }); }
      await autoDelete(chat_id, msg.message_id, false);
      return res.status(200).json({ ok: true });
    }

    if (isStart) {
      u.step = null;
      await tg('sendMessage', { chat_id, text: profileText(u), parse_mode: 'HTML', reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }

    if (['sex','birth','location','interest'].includes(u.step)) {
      if (u.step==='sex') u.sex = text;
      if (u.step==='birth') u.birth = text;
      if (u.step==='location') u.location = text;
      if (u.step==='interest') u.interest = text;
      u.step = null;
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
      if (!unlimited) u.coinfes -= 200;
      await autoDelete(chat_id, msg.message_id, false);
      await tg('sendMessage', { chat_id, text: `✅ <b>Terkirim!</b>\n\n${unlimited ? '♾️ Unlimited - Gratis' : `🪙 Sisa: <b>${u.coinfes}</b>`}\n\nKirim lagi? Langsung ketik aja 👇`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "👀 Lihat di Channel", url: "https://t.me/indo_fess" }],[{ text: "🛑 Berhenti", callback_data: "stop_kirim" }]] });
    } else {
      await tg('sendMessage', { chat_id, text: `❌ <b>Gagal post:</b> ${result?.description || 'Cek bot udah jadi admin di @indo_fess belum?' }`, parse_mode: 'HTML' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) { console.log(e); return res.status(200).json({ ok: true }); }
                                                                                     }
