// N.O.T.A - Menfess Umum Version
const TOKEN = process.env.BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;
const ADMIN_ID = 8742634172; // ganti id telegram kamu
const BASE = "@base_NOTA";

const sessions = new Map();

async function api(method, body) {
  return fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
async function send(chatId, text, buttons) {
  await api("sendMessage", {
    chat_id: chatId,
    text, parse_mode: "HTML",
    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");
  const u = req.body;

  // START
  if (u.message?.text === "/start") {
    const id = u.message.chat.id;
    sessions.delete(id);
    await send(id,
      `<b>N.O.T.A - Menfess</b>\n\nHalo! Kirim menfess anonim kamu di sini.\nMenfess akan dikirim ke ${BASE}\n\n<b>Cara kirim:</b>\n1. Klik Kirim Menfess\n2. Ketik menfess kamu\n3. Klik Kirim`,
      [
        [{ text: "✉️ Kirim Menfess", callback_data: "kirim" }],
        [{ text: "📩 Cek Menfess", callback_data: "cek" }, { text: "❓ Bantuan", callback_data: "help" }],
      ]);
    return res.status(200).send("ok");
  }

  // TOMBOL
  if (u.callback_query) {
    const q = u.callback_query;
    const id = q.message.chat.id;
    const data = q.data;
    await api("answerCallbackQuery", { callback_query_id: q.id });

    if (data === "kirim") {
      sessions.set(id, { step: "tulis" });
      await send(id, "✉️ <b>Tulis menfess kamu sekarang.</b>\n\nKetik aja langsung di sini.\nKetik /batal buat batalin.");
    }
    if (data === "cek") {
      await send(id, "📩 Menfess kamu belum ada yang dikirim.\n\nCek langsung di " + BASE);
    }
    if (data === "help") {
      await send(id, "<b>Bantuan</b>\n\n• Menfess anonim, identitas kamu aman\n• Jangan kirim SARA / porn / ujaran kebencian\n• Menfess di-review admin dulu\n\nAdmin: @jogja_lend");
    }
    if (data === "ya_kirim") {
      const s = sessions.get(id);
      if (s?.teks) {
        await api("sendMessage", { chat_id: ADMIN_ID, text: `📩 <b>Menfess Baru</b>\n\n${s.teks}\n\n---\nDari ID: ${id}`, parse_mode: "HTML" });
        sessions.delete(id);
        await send(id, "✅ <b>Menfess terkirim!</b>\n\nMenunggu di-review admin. Cek di " + BASE);
      }
    }
    if (data === "batal") {
      sessions.delete(id);
      await send(id, "❌ Menfess dibatalkan. Ketik /start buat mulai lagi.");
    }
    return res.status(200).send("ok");
  }

  // PESAN
  if (u.message?.text) {
    const id = u.message.chat.id;
    const teks = u.message.text;
    if (teks === "/batal") { sessions.delete(id); await send(id, "❌ Dibatalkan."); return res.status(200).send("ok"); }
    if (teks.startsWith("/")) return res.status(200).send("ok");

    const s = sessions.get(id);
    if (s?.step === "tulis") {
      s.teks = teks;
      s.step = "konfirmasi";
      await send(id, `<b>Preview menfess kamu:</b>\n\n${teks}\n\nKirim?`,
        [[{ text: "✅ Ya, Kirim", callback_data: "ya_kirim" }, { text: "❌ Batal", callback_data: "batal" }]]);
    } else {
      await send(id, "Klik <b>Kirim Menfess</b> dulu ya. Ketik /start");
    }
    return res.status(200).send("ok");
  }

  return res.status(200).send("ok");
}
