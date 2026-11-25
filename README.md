# Menfess @indofess
Stack: GitHub + Vercel + Neon + Telegram Bot

## Setup
1. Buat DB di Neon, jalankan:
CREATE TABLE menfess (id SERIAL PRIMARY KEY, user_id BIGINT, username TEXT, telegram_message_id BIGINT, content_type TEXT, content TEXT, file_id TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW());

2. Import repo ke Vercel, isi Env: BOT_TOKEN, ADMIN_ID, CHANNEL_ID, DATABASE_URL, ADMIN_KEY

3. Set Webhook:
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain-kamu>.vercel.app/api/webhook
