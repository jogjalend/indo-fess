// api/webhook.js - FULLFIX PENDEK - DIJAMIN JALAN
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@indo_fess";
const ADMIN_ID = 123456789; // GANTI ANGKA ID @jogja_lend, TANPA @ TANPA KUTIP

async function tg(m,b){ const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${m}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}); return r.json(); }
if(!globalThis.DB) globalThis.DB=new Map();
const DB=globalThis.DB;
function getUser(f){ if(!DB.has(f.id)) DB.set(f.id,{id:f.id,chat_id:f.id,first_name:f.first_name,sex:'-',birth:'-',location:'-',interest:'-',coinfes:1000,unlimited_until:null,join_time:new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}),step:null}); return DB.get(f.id); }
function isUnl(u){ return u.unlimited_until && new Date(u.unlimited_until)>new Date(); }
function profileText(u){ const unl=isUnl(u)?`Aktif s/d ${new Date(u.unlimited_until).toLocaleDateString('id-ID')}`:'Off'; return `👋 <b>Selamat Datang di IndoFess!</b>\n\nKirim menfess anonim ! 👇\n\n👤 <b>${u.first_name||'-'}</b>\n🆔 <code>${u.chat_id}</code>\n🎂 Birth : ${u.birth||'-'}\n📍 Location : ${u.location||'-'}\n⚧️ Sex : ${u.sex||'-'}\n\n🪙 Coinfes : <b>${u.coinfes}</b>\n♾️ Unlimited : ${unl}\n🔗 Join : ${u.join_time}\n\n👑 Admin : @jogja_lend\n🚨 Mod : @siverif`; }
function mainMenu(){ return {inline_keyboard:[[{text:"✍️ Kirim Menfess",callback_data:"kirim"}],[{text:"👤 Profile",callback_data:"profile"},{text:"⚙️ Setting",callback_data:"setting"}],[{text:"🪙 Beli Coinfes",callback_data:"beli"}],[{text:"❓ Bantuan",callback_data:"bantuan"}]]}; }
function setMenu(){ return {inline_keyboard:[[{text:"Sex",callback_data:"set_sex"},{text:"Birth",callback_data:"set_birth"}],[{text:"Location",callback_data:"set_loc"},{text:"Interest",callback_data:"set_interest"}],[{text:"⬅️ Kembali",callback_data:"back"}]]}; }
async function del(chat_id,mid){ try{ await tg('deleteMessage',{chat_id,message_id:mid}); }catch(e){} }

module.exports = async function handler(req,res){
  if(req.method!=='POST') return res.status(200).json({ok:true});
  try{
    const update=req.body;
    if(update.callback_query){
      const cb=update.callback_query; const chat_id=cb.message.chat.id; const mid=cb.message.message_id; const u=getUser(cb.from); const d=cb.data;
      await tg('answerCallbackQuery',{callback_query_id:cb.id});
      async function edit(t,m){ let r=await tg('editMessageText',{chat_id,message_id:mid,text:t,parse_mode:'HTML',reply_markup:m||mainMenu()}); if(!r.ok){ await del(chat_id,mid); await tg('sendMessage',{chat_id,text:t,parse_mode:'HTML',reply_markup:m||mainMenu()}); } }
      async function fresh(t){ await del(chat_id,mid); await tg('sendMessage',{chat_id,text:t,parse_mode:'HTML'}); }
      if(d==='profile') await edit(profileText(u));
      if(d==='back') await edit(profileText(u));
      if(d==='setting') await edit("<b>⚙️ Setting</b>\n\nPilih yang mau diubah:",setMenu());
      if(d==='set_sex'){ u.step='sex'; await fresh("Kirim Sex: <b>M / F</b>"); }
      if(d==='set_birth'){ u.step='birth'; await fresh("Kirim Birth: <b>Agustus 2002</b>"); }
      if(d==='set_loc'){ u.step='location'; await fresh("Kirim Location: <b>Yogyakarta</b>"); }
      if(d==='set_interest'){ u.step='interest'; await fresh("Kirim Interest: <b>M / F / All</b>"); }
      if(d==='kirim'){ u.step='kirim'; await fresh(isUnl(u)?"Kirim menfess kamu sekarang.\n\n♾️ Unlimited, gratis.":`Kirim menfess kamu sekarang.\n\n🪙 Coinfes: <b>${u.coinfes}</b> | 1 Post = 200`); }
      if(d==='beli') await edit("<b>🪙 Beli Coinfes</b>\n\n2.000 Coinfes - Rp 10.000\n20.000 Coinfes - Rp 50.000\nUnlimited 2 Bulan - Rp 100.000\n\nKirim bukti ke @jogja_lend",{inline_keyboard:[[{text:"💬 Chat Admin",url:"https://t.me/jogja_lend"}],[{text:"⬅️ Kembali",callback_data:"back"}]]});
      if(d==='bantuan') await edit("<b>❓ Bantuan</b>\n\n1. Klik Kirim Menfess\n2. Kirim menfess\n3. Auto ke-post di @indo_fess\n\n1 Post = 200 Coinfes");
      if(d==='stop_kirim'){ u.step=null; await edit(profileText(u)); }
      return res.status(200).json({ok:true});
    }
    const msg=update.message; if(!msg) return res.status(200).json({ok:true});
    const chat_id=msg.chat.id; const u=getUser(msg.from); const text=msg.text||msg.caption||""; const isStart=text==='/start';
    if(text.startsWith('/unlimited') && msg.from.id===ADMIN_ID){
      const tid=text.split(' ')[1]; const t=DB.get(Number(tid));
      if(!t){ await tg('sendMessage',{chat_id,text:`User ${tid} belum pernah /start.`}); return res.status(200).json({ok:true}); }
      const now=new Date(); const base=t.unlimited_until&&new Date(t.unlimited_until)>now?new Date(t.unlimited_until):now; base.setDate(base.getDate()+60); t.unlimited_until=base.toISOString();
      await tg('sendMessage',{chat_id:Number(tid),text:"🎉 <b>Unlimited Aktif!</b>\n\n♾️ Unlimited 2 Bulan aktif.",parse_mode:'HTML',reply_markup:mainMenu()});
      await tg('sendMessage',{chat_id,text:`✅ Unlimited 60 hari buat ${tid}`}); await del(chat_id,msg.message_id); return res.status(200).json({ok:true});
    }
    if(text.startsWith('/add') && msg.from.id===ADMIN_ID){
      const p=text.split(' '); const t=DB.get(Number(p[1])); const j=parseInt(p[2]||'0');
      if(t){ t.coinfes+=j; await tg('sendMessage',{chat_id:Number(p[1]),text:`🪙 <b>+${j} Coinfes masuk!</b>`,parse_mode:'HTML',reply_markup:mainMenu()}); await tg('sendMessage',{chat_id,text:`✅ +${j} ke ${p[1]}`}); }
      else await tg('sendMessage',{chat_id,text:`User ${p[1]} belum pernah /start.`});
      await del(chat_id,msg.message_id); return res.status(200).json({ok:true});
    }
    if(isStart){ u.step=null; await tg('sendMessage',{chat_id,text:profileText(u),parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
    if(['sex','birth','location','interest'].includes(u.step)){ if(u.step==='sex')u.sex=text; if(u.step==='birth')u.birth=text; if(u.step==='location')u.location=text; if(u.step==='interest')u.interest=text; u.step=null; await del(chat_id,msg.message_id); await tg('sendMessage',{chat_id,text:"✅ Disimpan.",parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
    if(u.step!=='kirim'){ if(text.startsWith('/')) return res.status(200).json({ok:true}); await del(chat_id,msg.message_id); await tg('sendMessage',{chat_id,text:"Klik dulu <b>Kirim Menfess</b>.",parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
    const unl=isUnl(u);
    if(!unl && u.coinfes<200){ await del(chat_id,msg.message_id); await tg('sendMessage',{chat_id,text:`❌ <b>Coinfes Habis!</b>\n\nCoinfes: <b>${u.coinfes}</b>\nButuh 200 buat 1 post.`,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"🪙 Beli Coinfes",callback_data:"beli"}]]}}); return res.status(200).json({ok:true}); }
    let fid=null,type='text'; if(msg.photo){ type='photo'; fid=msg.photo[msg.photo.length-1].file_id; } if(msg.video){ type='video'; fid=msg.video.file_id; }
    if(!text && type==='text') return res.status(200).json({ok:true});
    const cap=type==='text'?`${text}\n\n— via @indo_fess`:`${text?text+"\n\n":""}— via @indo_fess`;
    let r; if(type==='text') r=await tg('sendMessage',{chat_id:CHANNEL_ID,text:cap}); if(type==='photo') r=await tg('sendPhoto',{chat_id:CHANNEL_ID,photo:fid,caption:cap}); if(type==='video') r=await tg('sendVideo',{chat_id:CHANNEL_ID,video:fid,caption:cap});
    if(r?.ok){ if(!unl) u.coinfes-=200; await del(chat_id,msg.message_id); await tg('sendMessage',{chat_id,text:`✅ <b>Terkirim!</b>\n\n${unl?'♾️ Unlimited - Gratis':`🪙 Sisa: <b>${u.coinfes}</b>`}\n\nKirim lagi? Langsung ketik aja 👇`,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"👀 Lihat di Channel",url:"https://t.me/indo_fess"}],[{text:"🛑 Berhenti",callback_data:"stop_kirim"}]]}}); }
    else await tg('sendMessage',{chat_id,text:`❌ Gagal post: ${r?.description||'Bot belum jadi admin di @indo_fess?'}`,parse_mode:'HTML'});
    return res.status(200).json({ok:true});
  }catch(e){ console.log(e); return res.status(200).json({ok:true}); }
    }
