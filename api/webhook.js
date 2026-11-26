// N.O.T.A - FULL FIX - Langsung ke Base, Tanpa Review
const TOKEN = process.env.BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;
const BASE = "@base_NOTA";
const ADMIN = "@jogja_lend";

async function api(method, body) {
  const r = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function send(chatId, text, buttons) {
  return api("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
  });
}

function mainMenu() {
  return [
    [{ text: "✉️ Kirim Menfess", callback_data: "kirim" }],
    [{ text: "📩 Cek Menfess", callback_data: "cek" }, { text: "❓ Bantuan", callback_data: "help" }],
  ];
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(200).send("N.O.T.A OK");
    const u = req.body;
    if (!u) return res.status(200).send("ok");

    // ===== 1. COMMAND /start =====
    if (u.message?.text === "/start") {
      const id = u.message.chat.id;
      await send(id,
        `<b>N.O.T.A - Menfess</b>\n\nHalo! Kirim menfess anonim kamu di sini.\nMenfess langsung dikirim ke ${BASE}\n\n<b>Cara kirim:</b>\n1. Klik Kirim Menfess\n2. Ketik menfess kamu\n3. Otomatis terkirim`,
        mainMenu()
      );
      return res.status(200).send("ok");
    }

    // ===== 2. COMMAND /batal & /help =====
    if (u.message?.text === "/batal") {
      await send(u.message.chat.id, "❌ Dibatalkan. Ketik /start buat mulai lagi.", mainMenu());
      return res.status(200).send("ok");
    }
    if (u.message?.text === "/help") {
      await send(u.message.chat.id, `<b>Bantuan</b>\n\n• Menfess anonim, identitas kamu aman\n• Jangan kirim SARA / porn / ujaran kebencian\n\nAdmin: ${ADMIN}`);
      return res.status(200).send("ok");
    }

    // ===== 3. TOMBOL =====
    if (u.callback_query) {
      const q = u.callback_query;
      const id = q.message.chat.id;
      await api("answerCallbackQuery", { callback_query_id: q.id });

      if (q.data === "kirim") {
        await send(id, "✉️ <b>Tulis menfess kamu sekarang.</b>\n\nKetik aja langsung di sini, nanti otomatis terkirim ke base.\n\nKetik /batal buat batalin.");
      }
      if (q.data === "cek") {
        await send(id, "📩 Cek langsung di " + BASE, mainMenu());
      }
      if (q.data === "help") {
        await send(id, `<b>Bantuan</b>\n\n• Menfess anonim, identitas kamu aman\n• Jangan kirim SARA / porn / ujaran kebencian\n\nAdmin: ${ADMIN}`, mainMenu());
      }
      return res.status(200).send("ok");
    }

    // ===== 4. MENFESS TEKS -> LANGSUNG KE BASE =====
    if (u.message?.text && !u.message.text.startsWith("/")) {
      const id = u.message.chat.id;
      const teks = u.message.text;

      // Kirim ke base
      const result = await api("sendMessage", {
        chat_id: BASE,
        text: `${teks}\n\n— <i>via N.O.T.A</i>`,
        parse_mode: "HTML",
      });

      if (result.ok) {
        await send(id, `✅ <b>Menfess terkirim!</b>\n\nUdah langsung naik di ${BASE}`, mainMenu());
      } else {
        // Gagal = bot belum jadi admin channel
        await send(id, `❌ <b>Gagal kirim ke base.</b>\n\nPenyebab paling sering: bot belum jadi Admin di ${BASE}\n\n1. Buka channel ${BASE}\n2. Admins > Add Admin > @nofta_bot\n3. Kasih izin Post Messages\n\nAbis itu coba lagi.`, mainMenu());
      }
      return res.status(200).send("ok");
    }

    // ===== 5. MENFESS FOTO / MEDIA -> LANGSUNG KE BASE =====
    if (u.message?.photo || u.message?.video || u.message?.document) {
      const id = u.message.chat.id;
      const caption = u.message.caption || "";
      const fileId = u.message.photo ? u.message.photo[u.message.photo.length - 1].file_id : (u.message.video?.file_id || u.message.document?.file_id);
      const method = u.message.photo ? "sendPhoto" : (u.message.video ? "sendVideo" : "sendDocument");
      const key = u.message.photo ? "photo" : (u.message.video ? "video" : "document");

      const result = await api(method, {
        chat_id: BASE,
        [key]: fileId,
        caption: caption ? `${caption}\n\n— via N.O.T.A` : "— via N.O.T.A",
        parse_mode: "HTML",
      });

      if (result.ok) await send(id, `✅ <b>Media terkirim!</b>\n\nUdah naik di ${BASE}`, mainMenu());
      else await send(id, `❌ Gagal kirim. Bot belum jadi Admin di ${BASE}`, mainMenu());
      return res.status(200).send("ok");
    }

    return res.status(200).send("ok");
  } catch (e) {
    console.error(e);
    return res.status(200).send("ok");
  }
        }
