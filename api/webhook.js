// api/webhook.js - DEBUG VERSION
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@indo_fess";
const ADMIN_ID = 123456789;

async function tg(m,b){ const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${m}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}); return r.json(); }
if(!globalThis.DB) globalThis.DB=new Map();
const DB=globalThis.DB;
function getUser(f){ if(!DB.has(f.id)) DB.set(f.id,{id:f.id,chat_id:f.id,first_name:f.first_name,sex:'-',birth:'-',location:'-',coinfes:1000,unlimited_until:null,join_time:new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}),step:null}); return DB.get(f.id); }
function profileText(u){ return `👋 <b>Selamat Datang di IndoFess!</b>\n\nKirim menfess anonim ! 👇\n\n👤 <b>${u.first_name||'-'}</b>\n🆔 <code>${u.chat_id}</code>\n🎂 Birth : ${u.birth||'-'}\n📍 Location : ${u.location||'-'}\n⚧️ Sex : ${u.sex||'-'}\n\n🪙 Coinfes : <b>${u.coinfes}</b>\n♾️ Unlimited : Off\n🔗 Join : ${u.join_time}\n\n👑 Admin : @jogja_lend\n🚨 Mod : @siverif`; }
function mainMenu(){ return {inline_keyboard:[[{text:"✍️ Kirim Menfess",callback_data:"kirim"}],[{text:"👤 Profile",callback_data:"profile"}]]}; }

module.exports = async function handler(req,res){
  console.log("MASUK WEBHOOK", req.method, JSON.stringify(req.body).slice(0,200));
  if(req.method!=='POST') return res.status(200).json({ok:true});
  try{
    const update=req.body;
    if(update.callback_query){
      const cb=update.callback_query; const u=getUser(cb.from);
      await tg('answerCallbackQuery',{callback_query_id:cb.id});
      if(cb.data==='profile') await tg('editMessageText',{chat_id:cb.message.chat.id,message_id:cb.message.message_id,text:profileText(u),parse_mode:'HTML',reply_markup:mainMenu()});
      if(cb.data==='kirim'){ u.step='kirim'; await tg('sendMessage',{chat_id:cb.message.chat.id,text:`Kirim menfess sekarang.\n\n🪙 ${u.coinfes}`}); }
      return res.status(200).json({ok:true});
    }
    const msg=update.message; if(!msg) return res.status(200).json({ok:true});
    const u=getUser(msg.from); const text=msg.text||"";
    console.log("PESAN DARI", msg.from.id, text);
    if(text==='/start'){
      u.step=null;
      await tg('sendMessage',{chat_id:msg.chat.id,text:profileText(u),parse_mode:'HTML',reply_markup:mainMenu()});
      return res.status(200).json({ok:true});
    }
    if(u.step==='kirim'){
      const r=await tg('sendMessage',{chat_id:CHANNEL_ID,text:text+"\n\n— via @indo_fess"});
      if(r.ok){ u.coinfes-=200; await tg('sendMessage',{chat_id:msg.chat.id,text:`✅ Terkirim! Sisa: ${u.coinfes}`}); }
      else await tg('sendMessage',{chat_id:msg.chat.id,text:"❌ Gagal post: "+r.description});
      return res.status(200).json({ok:true});
    }
    await tg('sendMessage',{chat_id:msg.chat.id,text:"Klik dulu Kirim Menfess",reply_markup:mainMenu()});
    return res.status(200).json({ok:true});
  }catch(e){ console.log("ERROR WEBHOOK:",e); return res.status(200).json({ok:true}); }
}
