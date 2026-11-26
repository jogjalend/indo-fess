// N.O.T.A - Final Formal Version
const TOKEN = process.env.BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;
const BASE = "@base_NOTA";
const BASE_USERNAME = "base_NOTA";
const GROUP = "@diskusinota";
const ADMIN = "@jogja_lend";

// Simpan state user (wajib klik tombol dulu)
const state = new Map(); // userId -> { step: "menunggu_menfess" }
const lastMenfess = new Map(); // userId -> { chatId: BASE, messageId }

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

function menuUtama() {
  return [
    [{ text: "✉️ Kirim Menfess", callback_data: "kirim" }],
    [{ text: "👤 Profil", callback_data: "profil" }, { text: "❓ Bantuan", callback_data: "help" }],
  ];
}

function menuSukses(link) {
  return [
    [{ text: "🗑️ Hapus", callback_data: "hapus" }, { text: "🔗 Link Menfess", url: link }],
    [{ text: "❓ Bantuan", callback_data: "help" }],
  ];
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(200).send("N.O.T.A OK");
    const u = req.body;
    if (!u) return res.status(200).send("ok");

    // ===== /start =====
    if (u.message?.text === "/start") {
      const id = u.message.chat.id;
      state.delete(id);
      await send(id,
        `<b>Selamat Datang di N.O.T.A</b>\n\n` +
        `Terima kasih telah menggunakan layanan N.O.T.A.\n` +
        `Silakan kirim menfess anonim Anda melalui bot ini.\n` +
        `Menfess Anda akan diteruskan ke kanal ${BASE}.\n\n` +
        `<b>Petunjuk Penggunaan:</b>\n` +
        `1. Tekan tombol Kirim Menfess\n` +
        `2. Tulis pesan menfess Anda\n` +
        `3. Menfess akan langsung terkirim ke kanal\n\n` +
        `Untuk informasi lebih lanjut, silakan tekan tombol Bantuan.`,
        menuUtama()
      );
      return res.status(200).send("ok");
    }

    // ===== /batal =====
    if (u.message?.text === "/batal") {
      state.delete(u.message.chat.id);
      await send(u.message.chat.id, "Permintaan dibatalkan. Silakan ketik /start untuk kembali ke menu utama.", menuUtama());
      return res.status(200).send("ok");
    }

    // ===== TOMBOL =====
    if (u.callback_query) {
      const q = u.callback_query;
      const id = q.message.chat.id;
      await api("answerCallbackQuery", { callback_query_id: q.id });

      if (q.data === "kirim") {
        state.set(id, { step: "menunggu_menfess" });
        await send(id,
          `<b>Kirim Menfess</b>\n\n` +
          `Silakan tulis menfess Anda sekarang.\n` +
          `Pesan yang Anda kirim akan diteruskan ke kanal ${BASE}.\n\n` +
          `Ketik /batal untuk membatalkan.`
        );
      }
      if (q.data === "profil") {
        const username = q.from.username ? `@${q.from.username}` : "-";
        await send(id,
          `<b>Profil Anda</b>\n\n` +
          `Nama: ${q.from.first_name || "-"}\n` +
          `Username: ${username}\n` +
          `ID Telegram: <code>${id}</code>\n\n` +
          `Identitas Anda tetap terjaga dan tidak akan ditampilkan pada menfess yang dikirim.`,
          menuUtama()
        );
      }
      if (q.data === "help") {
        await send(id,
          `<b>Bantuan</b>\n\n` +
          `<b>Cara Mengirim Menfess:</b>\n` +
          `1. Tekan tombol Kirim Menfess\n` +
          `2. Tulis pesan Anda\n` +
          `3. Menfess akan langsung terkirim\n\n` +
          `<b>Ketentuan:</b>\n` +
          `• Dilarang mengirim konten SARA, pornografi, dan ujaran kebencian\n` +
          `• Menfess bersifat anonim\n\n` +
          `Apabila mengalami kendala, silakan hubungi Admin: ${ADMIN}`,
          menuUtama()
        );
      }
      if (q.data === "hapus") {
        const m = lastMenfess.get(id);
        if (m) {
          await api("deleteMessage", { chat_id: m.chatId, message_id: m.messageId });
          lastMenfess.delete(id);
          await send(id, "Menfess Anda telah berhasil dihapus dari kanal.", menuUtama());
        } else {
          await send(id, "Maaf, menfess tidak ditemukan atau sudah dihapus sebelumnya.", menuUtama());
        }
      }
      return res.status(200).send("ok");
    }

    // ===== PESAN TEKS =====
    if (u.message?.text && !u.message.text.startsWith("/")) {
      const id = u.message.chat.id;
      const teks = u.message.text;
      const s = state.get(id);

      // 1. BELUM KLIK TOMBOL -> GAGAL
      if (!s || s.step !== "menunggu_menfess") {
        await send(id,
          `<b>Gagal Mengirim Menfess</b>\n\n` +
          `Maaf, Anda belum menekan tombol Kirim Menfess.\n` +
          `Silakan tekan tombol Kirim Menfess terlebih dahulu, kemudian tulis pesan Anda.`,
          menuUtama()
        );
        return res.status(200).send("ok");
      }

      // 2. SUDAH KLIK -> KIRIM KE BASE
      state.delete(id);
      const result = await api("sendMessage", {
        chat_id: BASE,
        text: `${teks}\n\n— <i>via N.O.T.A</i>`,
        parse_mode: "HTML",
      });

      if (result.ok) {
        const msgId = result.result.message_id;
        lastMenfess.set(id, { chatId: BASE, messageId: msgId });
        const link = `https://t.me/${BASE_USERNAME}/${msgId}`;
        await send(id,
          `<b>Menfess Terkirim!</b>\n\n` +
          `Terima kasih, menfess Anda telah berhasil dikirim.\n\n` +
          `Jangan lupa untuk mengikuti:\n` +
          `Kanal: ${BASE}\n` +
          `Grup Diskusi: ${GROUP}`,
          menuSukses(link)
        );
      } else {
        await send(id,
          `<b>Gagal Mengirim Menfess</b>\n\n` +
          `Maaf, terjadi kendala saat mengirim menfess.\n` +
          `Pastikan bot telah dijadikan Admin di kanal ${BASE}.\n\n` +
          `Silakan hubungi Admin: ${ADMIN}`,
          menuUtama()
        );
      }
      return res.status(200).send("ok");
    }

    // ===== PESAN FOTO / MEDIA =====
    if (u.message?.photo || u.message?.video) {
      const id = u.message.chat.id;
      const s = state.get(id);
      if (!s || s.step !== "menunggu_menfess") {
        await send(id, `<b>Gagal Mengirim Menfess</b>\n\nMaaf, Anda belum menekan tombol Kirim Menfess. Silakan tekan tombol Kirim Menfess terlebih dahulu.`, menuUtama());
        return res.status(200).send("ok");
      }
      state.delete(id);
      const caption = u.message.caption || "";
      const isPhoto = !!u.message.photo;
      const fileId = isPhoto ? u.message.photo[u.message.photo.length - 1].file_id : u.message.video.file_id;
      const result = await api(isPhoto ? "sendPhoto" : "sendVideo", {
        chat_id: BASE,
        [isPhoto ? "photo" : "video"]: fileId,
        caption: caption ? `${caption}\n\n— via N.O.T.A` : "— via N.O.T.A",
        parse_mode: "HTML",
      });
      if (result.ok) {
        const msgId = result.result.message_id;
        lastMenfess.set(id, { chatId: BASE, messageId: msgId });
        const link = `https://t.me/${BASE_USERNAME}/${msgId}`;
        await send(id, `<b>Menfess Terkirim!</b>\n\nTerima kasih, menfess Anda telah berhasil dikirim.\n\nJangan lupa untuk mengikuti:\nKanal: ${BASE}\nGrup Diskusi: ${GROUP}`, menuSukses(link));
      } else {
        await send(id, `<b>Gagal Mengirim Menfess</b>\n\nSilakan hubungi Admin: ${ADMIN}`, menuUtama());
      }
      return res.status(200).send("ok");
    }

    return res.status(200).send("ok");
  } catch (e) {
    console.error(e);
    return res.status(200).send("ok");
  }
}
