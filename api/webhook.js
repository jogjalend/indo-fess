// api/webhook.js - FULL FIX FINAL - COINFES SYSTEM
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
  const fallback = { id: from.id, chat_id: from.id, username: from.username || '-', name: from.first_name, first_name: from.first_name, sex: '-', birth: '-', location: '-', interest: '-', score: 100, coinfes: 1000, unlimited_until: null, safe: false, join_time: '-', step: null };
  if (!sql) return fallback;
  try {
    let rows = await sql`SELECT * FROM users WHERE chat_id = ${from.id}`;
    if (rows.length === 0) {
      const join = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      await sql`INSERT INTO users (chat_id, username, first_name, join_time, coinfes) VALUES (${from.id}, ${from.username || '-'}, ${from.first_name}, ${join}, 1000)`;
      rows = await sql`SELECT * FROM users WHERE chat_id = ${from.id}`;
    }
    let r = rows[0];
    r.id = r.chat_id;
    r.name = r.first_name;
    r.coinfes = r.coinfes ?? 1000;
    return r;
  } catch (e) { console.log("DB error:", e.message); return fallback; }
}

function isUnlimited(u) {
  return u.unlimited_until && new Date(u.unlimited_until) > new Date();
}

function profileText(u) {
  const unlimitedText = isUnlimited(u) ? `♾️ <b>UNLIMITED</b> s/d ${new Date(u.unlimited_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : '❌ OFF';
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
│  🪙 Coinfes : <b>${u.coinfes ?? 1000}</b>
│  ♾️ Unlimited : ${unlimitedText}
│  📝 1 Post = <b>200 Coinfes</b>
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
    [{ text: "⏳ Riwayat", callback_data: "riwayat" }, { text: "🪙 Beli Coinfes", callback_data: "beli" }],
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
      if (d === 'kirim') { if(sql) try{ await sql`UPDATE users SET step='kirim' WHERE chat_id=${u.chat_id}`; }catch(e){} await fresh("✉️ <b>Kirim menfess kamu sekarang</b> (teks / foto / video).\n\nTeks kamu <b>tidak akan dihapus</b>.\n\n" + (isUnlimited(u) ? "♾️ Kamu <b>UNLIMITED</b>, gratis kirim sepuasnya!" : `🪙 Coinfes kamu: <b>${u.coinfes ?? 1000}</b> | 1 Post = <b>200</b>`)); }
      if (d === 'riwayat') { let list="Belum ada."; if(sql){ try{ const r=await sql`SELECT content FROM menfess WHERE user_id=${u.chat_id} ORDER BY id DESC LIMIT 5`; if(r.length) list=r.map((x,i)=>`${i+1}. ${x.content?.slice(0,60)}`).join("\n"); }catch(e){} } await edit(`⏳ <b>Riwayat:</b>\n\n${list}`); }
      if (d === 'beli') await edit("🪙 <b>Beli Coinfes</b>\n\n🪙 <b>2.000 Coinfes</b> - Rp 10.000\n🪙 <b>20.000 Coinfes</b> - Rp 50.000\n♾️ <b>UNLIMITED 2 Bulan</b> - Rp 100.000\n<i>Unlimited = Gak perlu bayar Coinfes lagi!</i>\n\nCara beli:\n1. Transfer ke Admin\n2. Kirim bukti ke @carebian_5\n3. Coinfes langsung masuk!", { inline_keyboard: [[{ text: "💬 Chat Admin Buat Beli", url: "https://t.me/carebian_5" }],[{ text: "⬅️ Kembali", callback_data: "back" }]] });
      if (d === 'bantuan') await edit("❓ <b>Bantuan</b>\n\n1. Klik <b>Kirim Menfess</b>\n2. Kirim menfess\n3. Auto ke-post di @indo_fess\n\n🪙 1 Post = 200 Coinfes\n♾️ Unlimited 100K = Gratis 2 Bulan");
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

    // ===== ADMIN: /unlimited =====
    if (text.startsWith('/unlimited') && msg.from.id === ADMIN_ID) {
      const targetId = text.split(' ')[1];
      if (!targetId) { await tg('sendMessage', { chat_id, text: "Cara: /unlimited 123456789" }); return res.status(200).json({ ok: true }); }
      if (sql) try {
        await sql`UPDATE users SET unlimited_until = CASE WHEN unlimited_until IS NULL OR unlimited_until < NOW() THEN NOW() + INTERVAL '60 days' ELSE unlimited_until + INTERVAL '60 days' END WHERE chat_id=${targetId}`;
        await tg('sendMessage', { chat_id: targetId, text: `🎉 <b>SELAMAT! KAMU JADI UNLIMITED!</b>\n\n♾️ Unlimited 2 Bulan aktif!\n🪙 Gak perlu bayar Coinfes lagi per post!\n\nGas kirim menfess sepuasnya! 👇`, parse_mode: 'HTML', reply_markup: mainMenu() });
        await tg('sendMessage', { chat_id, text: `✅ Unlimited 60 hari aktif buat ${targetId}` });
      } catch(e){ await tg('sendMessage', { chat_id, text: "Gagal: " + e.message }); }
      return res.status(200).json({ ok: true });
    }

    // ===== ADMIN: /add =====
    if (text.startsWith('/add') && msg.from.id === ADMIN_ID) {
      const parts = text.split(' ');
      const targetId = parts[1]; const jumlah = parseInt(parts[2] || '0');
      if (sql) try {
        await sql`UPDATE users SET coinfes=coinfes+${jumlah} WHERE chat_id=${targetId}`;
        await tg('sendMessage', { chat_id: targetId, text: `🪙 <b>+${jumlah} Coinfes masuk!</b>\n\nMakasih udah top up! Gas kirim menfess! 👇`, parse_mode: 'HTML', reply_markup: mainMenu() });
        await tg('sendMessage', { chat_id, text: `✅ +${jumlah} ke ${targetId}` });
      } catch(e){}
      return res.status(200).json({ ok: true });
    }

    if (text === '/start') {
      if(sql) try{ await sql`UPDATE users SET step=NULL WHERE chat_id=${u.chat_id}`; }catch(e){}
      try { await tg('deleteMessage', { chat_id, message_id: msg.message_id }); } catch(e){}
      const welcome = `👋 <b>Selamat Datang di IndoFess!</b>\n\n🎁 Daftar baru dapet <b>1000 Coinfes GRATIS!</b>\n📝 1 Post = 200 Coinfes\n♾️ Unlimited 2 Bulan cuma 100K\n\nKirim menfess anonim tanpa takut ketahuan! 👇\n\n`;
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

    // ===== CEK COINFES & UNLIMITED =====
    const unlimited = isUnlimited(u);
    if (!unlimited && (u.coinfes ?? 0) < 200) {
      await tg('sendMessage', { chat_id, text: `╭─── <b>❌ COINFES HABIS!</b> ───╮
│
│  Coinfes kamu : <b>${u.coinfes ?? 0}</b>
│  Butuh : <b>200</b> buat 1 post 😭
│
│  Top up dulu yuk biar bisa kirim lagi!
│
╰───────────────────╯`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [
        [{ text: "🪙 Beli Coinfes", callback_data: "beli" }],
        [{ text: "👤 Profile", callback_data: "profile" }]
      ]}});
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
      let sisa = u.coinfes ?? 1000;
      if (sql) try {
        if (!unlimited) { await sql`UPDATE users SET coinfes=coinfes-200, step='kirim' WHERE chat_id=${u.chat_id}`; sisa = sisa - 200; }
        else { await sql`UPDATE users SET step='kirim' WHERE chat_id=${u.chat_id}`; }
        await sql`INSERT INTO menfess (user_id, content, type) VALUES (${u.chat_id}, ${text || '[Media]'}, ${type})`;
      } catch (e) {}
      // TIDAK ADA deleteMessage - TEKS USER TETAP ADA
      const preview = text ? (text.length > 80 ? text.slice(0,80) + "..." : text) : (type === 'photo' ? '📷 Foto' : '🎥 Video');
      const successText = `╭─── <b>✅ MENFESS TERKIRIM!</b> ───╮
│
│  <i>"${preview}"</i>
│
│  Berhasil di-post ke @indo_fess
│  Identitas kamu tetap <b>ANONIM</b> 🤫
│
│  ───────────────
│  ${unlimited ? '♾️ <b>UNLIMITED</b> - Gratis! Gak potong Coinfes.' : `🪙 Sisa Coinfes : <b>${sisa}</b>\n│  📝 1 Post = 200 Coinfes`}
│
╰───────────────────╯

Mau kirim lagi? <b>Langsung ketik aja</b> 👇`;
      await tg('sendMessage', { chat_id, text: successText, parse_mode: 'HTML', reply_markup: { inline_keyboard: [
        [{ text: "👀 Lihat di Channel", url: "https://t.me/indo_fess" }],
        [{ text: "✍️ Kirim Lagi ➤", callback_data: "kirim" }, { text: "🛑 Berhenti", callback_data: "stop_kirim" }],
        [{ text: "👤 Profile", callback_data: "profile" }]
      ]}});
    } else {
      await tg('sendMessage', { chat_id, text: `❌ <b>Gagal post:</b> ${result?.description}\n\nCoba kirim ulang ya.`, parse_mode: 'HTML' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) { console.log(e); return res.status(200).json({ ok: true }); }
}
