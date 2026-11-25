// api/webhook.js - FULL FIX FINAL + TEKS GAK DIHAPUS + BALASAN CAKEP
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@indo_fess";
const ADMIN_BASE = "@siverif";
const MOD_BASE = "@jogja_lend";
const ADMIN_ID = 123456789; // GANTI PAKE ID KAMU
const BANNER_URL = "https://i.imgur.com/8Qw4w9a.jpeg"; // GANTI PAKE LINK BANNER KAMU

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
    r.id = r.chat_id;
    r.name = r.first_name;
    return r;
  } catch (e) { console.log("DB error:", e.message); return fallback; }
}

function profileText(u) {
  const bar = (val, max) => {
    const filled = Math.round((val / max) * 10);
    return "▓".repeat(filled) + "░".repeat(10 - filled);
  };
  return `╭─── <b>✦ INDOFESS PROFILE ✦</b> ───╮
│
│  👤 <b>${u.first_name || u.name}</b>  @${u.username}
│  🆔 <code>${u.chat_id || u.id}</code>
│
│  ⚧ Sex       : <b>${u.sex || '-'}</b>
│  🎂 Birth     : <b>${u.birth || '-'}</b>
│  📍 Location  : <b>${u.location || '-'}</b>
│  👀 Interest  : <b>${u.interest || '-'}</b>
│
│  ───────────────
│  ⚡ Score
│  <code>${bar(u.score ?? 100, 100)} ${u.score ?? 100}/100</code>
│
│  💰 Coin         : <b>${u.coin ?? 20}</b> / 24H
│  💎 Coin Special : <b>${u.coin_special ?? 0}</b>
│  💔 Kuota Gratis : <b>${u.kuota ?? 1}x</b>
│  🎗 Safe Sender  : ${u.safe ? '✅ ON' : '❌ OFF'}
│
│  🔗 Join : ${u.join_time || '-'}
│
╰─── <b>@indo_fess</b> ───╯

👑 Admin : ${ADMIN_BASE}
🚨 Mod    : ${MOD_BASE}`;
}

function mainMenu() {
  return { inline_keyboard: [
    [{ text: "✍️  KIRIM MENFESS  ➤", callback_data: "kirim" }],
    [{ text: "👤 Profile", callback_data: "profile" }, { text: "⚙️ Setting", callback_data: "setting" }],
    [{ text: "⏳ Riwayat", callback_data: "riwayat" }, { text: "💎 Beli Coin", callback_data: "beli" }],
    [{ text: "❓ Bantuan", callback_data: "bantuan" }, { text: "📜 Peraturan", callback_data: "peraturan" }],
    [{ text: "🪶 Kritik & Saran", callback_data: "kritik" }]
  ]};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  try {
    const sql = await getSql();
    const update = req.body;

    // ===== CALLBACK =====
    if (update.callback_query) {
      const cb = update.callback_query;
      const chat_id = cb.message.chat.id;
      const message_id = cb.message.message_id;
      const u = await getUser(sql, cb.from);
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      const d = cb.data;

      async function edit(text, markup) {
        let r = await tg('editMessageCaption', { chat_id, message_id, caption: text, parse_mode: 'HTML', reply_markup: markup || mainMenu() });
        if (!r.ok) r = await tg('editMessageText', { chat_id, message_id, text, parse_mode: 'HTML', reply_markup: markup || mainMenu() });
        if (!r.ok) { try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){} await tg('sendMessage', { chat_id, text, parse_mode: 'HTML', reply_markup: markup || mainMenu() }); }
      }
      async function fresh(text) { try { await tg('deleteMessage', { chat_id, message_id }); } catch(e){} await tg('sendMessage', { chat_id, text, parse_mode: 'HTML' }); }

      if (d === 'profile') await edit(profileText(u));
      if (d === 'setting') await edit("⚙️ <b>Setting</b>\n\nPilih yang mau diubah:", { inline_keyboard: [[{ text: "⚧ Sex", callback_data: "set_sex" }, { text: "🎂 Birth", callback_data: "set_birth" }],[{ text: "📍 Location", callback_data: "set_loc" }, { text: "👀 Interest", callback_data: "set_interest" }],[{ text: "⬅️ Kembali", callback_data: "back" }]] });
      if (d === 'set_sex') { if(sql) try{ await sql`UPDATE users SET step='sex' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Sex: <b>M / F</b>"); }
      if (d === 'set_birth') { if(sql) try{ await sql`UPDATE users SET step='birth' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Birth: <b>Agustus 2002</b>"); }
      if (d === 'set_loc') { if(sql) try{ await sql`UPDATE users SET step='location' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Location: <b>Yogyakarta</b>"); }
      if (d === 'set_interest') { if(sql) try{ await sql`UPDATE users SET step='interest' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("Kirim Interest: <b>M / F / All</b>"); }
      if (d === 'kirim') { if(sql) try{ await sql`UPDATE users SET step='kirim' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("✉️ <b>Kirim menfess kamu sekarang</b> (teks / foto / video).\n\nTeks kamu <b>tidak akan dihapus</b>, jadi aman."); }
      if (d === 'riwayat') { let list="Belum ada."; if(sql){ try{ const r=await sql`SELECT content FROM menfess WHERE user_id=${u.chat_id} ORDER BY id DESC LIMIT 5`; if(r.length) list=r.map((x,i)=>`${i+1}. ${x.content?.slice(0,60)}`).join("\n"); }catch(e){} } await edit(`⏳ <b>Riwayat:</b>\n\n${list}`); }
      if (d === 'beli') await edit("💎 <b>Beli Coin</b>\n\n10 Coin = 5k\n50 Coin = 20k\n100 Coin = 35k\n\nChat Admin: @carebian_5");
      if (d === 'bantuan') await edit("❓ <b>Bantuan</b>\n\n1. Klik <b>Kirim Menfess</b>\n2. Kirim menfess\n3. Auto ke-post di @indo_fess");
      if (d === 'peraturan') await edit("📜 <b>Peraturan @indo_fess</b>\n\n1. No SARA & porn\n2. No doxxing\n3. No spam\n\nLanggar = Ban!");
      if (d === 'kritik') { if(sql) try{ await sql`UPDATE users SET step='kritik' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("🪶 <b>Kirim Kritik / Saran kamu.</b>"); }
      if (d === 'back') await edit(profileText(u));
      if (d === 'stop_kirim') { if(sql) try{ await sql`UPDATE users SET step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){} await edit(profileText(u)); }
      return res.status(200).json({ ok: true });
    }

    // ===== MESSAGE =====
    const msg = update.message;
    if (!msg) return res.status(200).json({ ok: true });
    const chat_id = msg.chat.id;
    const u = await getUser(sql, msg.from);
    const text = msg.text || msg.caption || "";

    if (text === '/start') {
      if(sql) try{ await sql`UPDATE users SET step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){}
      try { await tg('deleteMessage', { chat_id, message_id: msg.message_id }); } catch(e){}
      const welcome = `👋 <b>Selamat Datang di IndoFess!</b>\n\nKirim menfess anonim tanpa takut ketahuan.\nLengkapi profil kamu, terus gas kirim! 👇\n\n`;
      const r = await tg('sendPhoto', { chat_id, photo: BANNER_URL, caption: welcome + profileText(u), parse_mode: 'HTML', reply_markup: mainMenu() });
      if (!r.ok) await tg('sendMessage', { chat_id, text: welcome + profileText(u), parse_mode: 'HTML', reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }

    if (['sex','birth','location','interest'].includes(u.step)) {
      if(sql) try{ if(u.step==='sex') await sql`UPDATE users SET sex=${text}, step=NULL WHERE chat_id=${u.chat_id}`; if(u.step==='birth') await sql`UPDATE users SET birth=${text}, step=NULL WHERE chat_id=${u.chat_id}`; if(u.step==='location') await sql`UPDATE users SET location=${text}, step=NULL WHERE chat_id=${u.chat_id}`; if(u.step==='interest') await sql`UPDATE users SET interest=${text}, step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){}
      const nu = await getUser(sql, msg.from);
      await tg('sendMessage', { chat_id, text: "✅ <b>Disimpan!</b>", parse_mode: 'HTML', reply_markup: mainMenu() });
      await tg('sendPhoto', { chat_id, photo: BANNER_URL, caption: profileText(nu), parse_mode: 'HTML', reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }

    if (u.step === 'kritik') {
      if(sql) try{ await sql`UPDATE users SET step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){}
      await tg('sendMessage', { chat_id: ADMIN_ID, text: `📩 Kritik dari @${u.username}:\n\n${text}` });
      await tg('sendMessage', { chat_id, text: "✅ <b>Kritik diteruskan.</b>\n\nMakasih udah bantu IndoFess jadi lebih baik! 🙏", parse_mode: 'HTML', reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }

    if (u.step !== 'kirim') {
      if (text.startsWith('/')) return res.status(200).json({ ok: true });
      await tg('sendMessage', { chat_id, text: "Klik dulu tombol <b>Kirim Menfess ➤</b> di bawah biar menfess kamu ke-post.", parse_mode: 'HTML', reply_markup: mainMenu() });
      return res.status(200).json({ ok: true });
    }

    // ===== KIRIM MENFESS - TEKS TIDAK DIHAPUS =====
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
      let sisaKuota = u.kuota ?? 1;
      let sisaCoin = u.coin ?? 20;
      if (sql) try {
        if (u.kuota > 0) { await sql`UPDATE users SET kuota=kuota-1, step='kirim' WHERE chat_id=${u.chat_id}`; sisaKuota = u.kuota - 1; }
        else { await sql`UPDATE users SET coin=coin-1, step='kirim' WHERE chat_id=${u.chat_id}`; sisaCoin = u.coin - 1; }
        await sql`INSERT INTO menfess (user_id, content, type) VALUES (${u.chat_id}, ${text || '[Media]'}, ${type})`;
      } catch (e) {}
      // TIDAK ADA deleteMessage DI SINI - TEKS USER TETAP ADA
      const preview = text ? (text.length > 80 ? text.slice(0,80) + "..." : text) : (type === 'photo' ? '📷 Foto' : '🎥 Video');
      const successText = `╭─── <b>✅ MENFESS TERKIRIM!</b> ───╮
│
│  <i>"${preview}"</i>
│
│  Berhasil di-post ke @indo_fess
│  Identitas kamu tetap <b>ANONIM</b> 🤫
│
│  ───────────────
│  💔 Sisa Kuota Gratis : <b>${sisaKuota}x</b>
│  💰 Sisa Coin : <b>${sisaCoin}</b>
│
╰───────────────────╯

Mau kirim lagi? <b>Langsung ketik aja</b> di sini, gak perlu klik tombol lagi 👇`;
      await tg('sendMessage', { chat_id, text: successText, parse_mode: 'HTML', reply_markup: { inline_keyboard: [
        [{ text: "👀 Lihat di Channel", url: "https://t.me/indo_fess" }],
        [{ text: "✍️ Kirim Lagi ➤", callback_data: "kirim" }, { text: "🛑 Berhenti", callback_data: "stop_kirim" }],
        [{ text: "👤 Profile", callback_data: "profile" }, { text: "🏠 Menu Utama", callback_data: "back" }]
      ]}});
    } else {
      await tg('sendMessage', { chat_id, text: `❌ <b>Gagal post:</b> ${result?.description}\n\nCoba kirim ulang ya.`, parse_mode: 'HTML' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) { console.log(e); return res.status(200).json({ ok: true }); }
      }
