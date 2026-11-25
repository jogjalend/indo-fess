// api/webhook.js - FULLFIX FINAL INDO FESS - MODEL ALTER - SEMUA ID UDAH BENER
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "@indo_fess";
const GROUP_ID = -1005709337757;
const ADMIN_ID = 8584319568;
const BOT_USERNAME = "Indofess_bot";

async function tg(m,b){ const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${m}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}); return r.json(); }
if(!globalThis.DB) globalThis.DB=new Map();
if(!globalThis.POSTS) globalThis.POSTS=new Map();
if(!globalThis.COUNTER) globalThis.COUNTER=0;
const DB=globalThis.DB; const POSTS=globalThis.POSTS;
function getUser(f){ if(!DB.has(f.id)) DB.set(f.id,{id:f.id,chat_id:f.id,username:f.username||'-',first_name:f.first_name,sex:'-',birth:'-',location:'-',interest:'-',coinfes:1000,unlimited_until:null,join_time:new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}),step:null}); let u=DB.get(f.id); u.username=f.username||u.username; u.first_name=f.first_name; return u; }
function isUnl(u){ return u.unlimited_until && new Date(u.unlimited_until)>new Date(); }
function makeCode(){ const c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; let s=""; for(let i=0;i<8;i++) s+=c[Math.floor(Math.random()*c.length)]; return "$"+s; }
function profileText(u){ const unl=isUnl(u)?`Aktif s/d ${new Date(u.unlimited_until).toLocaleDateString('id-ID')}`:'Off'; return `👋 <b>Selamat Datang di IndoFess!</b>\n\nKirim menfess anonim ! 👇\n\n👤 <b>${u.first_name||'-'}</b>\n🆔 <code>${u.chat_id}</code>\n🎂 Birth : ${u.birth||'-'}\n📍 Location : ${u.location||'-'}\n⚧️ Sex : ${u.sex||'-'}\n\n🪙 Coinfes : <b>${u.coinfes}</b>\n♾️ Unlimited : ${unl}\n🔗 Join : ${u.join_time}\n\n👑 Admin : @jogja_lend\n🚨 Mod : @siverif`; }
function mainMenu(){ return {inline_keyboard:[[{text:"✍️ Kirim Menfess",callback_data:"kirim"}],[{text:"👤 Profile",callback_data:"profile"},{text:"⚙️ Setting",callback_data:"setting"}],[{text:"🪙 Beli Coinfes",callback_data:"beli"}],[{text:"❓ Bantuan",callback_data:"bantuan"}]]}; }
function setMenu(){ return {inline_keyboard:[[{text:"Sex",callback_data:"set_sex"},{text:"Birth",callback_data:"set_birth"}],[{text:"Location",callback_data:"set_loc"},{text:"Interest",callback_data:"set_interest"}],[{text:"⬅️ Kembali",callback_data:"back"}]]}; }
function bantuanText(){ return `<b>❓ BANTUAN - INDO FESS</b>\n\n<b>✍️ Cara Kirim Menfess:</b>\n1. Klik <b>Kirim Menfess</b>\n2. Ketik / kirim foto / video\n3. Auto ke-post di @indo_fess\n4. Pesan kamu auto ke-hapus, aman!\n\n<b>💞 HITME:</b> Minta kenalan, pengirim bisa Terima/Tolak. Kalau Terima username dibuka.\n<b>💌 WHO:</b> Liat profil anonim pengirim (Sex, Birth, Location)\n<b>💬 TALK:</b> Komen di grup diskusi, muncul di channel\n<b>❗ Report:</b> Laporin menfess yang ngelanggar ke admin\n\n<b>🪙 Coinfes:</b>\n1 Post = 200 Coinfes\nSaldo awal = 1000 Coinfes\n\n<b>🪙 Harga:</b>\n2.000 Coinfes - Rp 10.000\n20.000 Coinfes - Rp 50.000\nUnlimited 2 Bulan - Rp 100.000\n\n<b>👑 Admin:</b> @jogja_lend`; }
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
      if(d.startsWith('hmu_yes_')){ const reqId=Number(d.replace('hmu_yes_','')); const reqUser=DB.get(reqId); await edit(`✅ <b>Kamu Terima HITME!</b>`); const myName=u.username!=='-'?`@${u.username}`:`${u.first_name} (ID: ${u.chat_id})`; const reqName=reqUser&&reqUser.username!=='-'?`@${reqUser.username}`:`${reqUser?.first_name||'User'} (ID: ${reqId})`; await tg('sendMessage',{chat_id:reqId,text:`🎉 <b>HITME Diterima!</b>\n\n${myName} nerima HITME kamu!\n\nChat dia: ${myName}`,parse_mode:'HTML',reply_markup:mainMenu()}); await tg('sendMessage',{chat_id,text:`👋 <b>Kontak Dia:</b>\n\n${reqName}`,parse_mode:'HTML'}); return res.status(200).json({ok:true}); }
      if(d.startsWith('hmu_no_')){ const reqId=Number(d.replace('hmu_no_','')); await edit(`❌ <b>HITME Ditolak.</b>`); await tg('sendMessage',{chat_id:reqId,text:`😔 <b>HITME Ditolak</b>`,parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
      if(d.startsWith('who_yes_')){ const reqId=Number(d.replace('who_yes_','')); await edit(`✅ <b>Kamu Buka Identitas!</b>`); const myName=u.username!=='-'?`@${u.username}`:`${u.first_name}`; await tg('sendMessage',{chat_id:reqId,text:`💌 <b>WHO Dibuka!</b>\n\nPengirim menfess itu: ${myName}`,parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
      if(d.startsWith('who_no_')){ const reqId=Number(d.replace('who_no_','')); await edit(`❌ <b>WHO Ditolak.</b>\n\nIdentitas kamu tetep anonim.`); await tg('sendMessage',{chat_id:reqId,text:`😔 <b>WHO Ditolak</b>\n\nPengirim gak mau buka identitas.`,parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
      if(d==='profile') await edit(profileText(u));
      if(d==='back') await edit(profileText(u));
      if(d==='setting') await edit("<b>⚙️ Setting</b>\n\nPilih yang mau diubah:",setMenu());
      if(d==='set_sex'){ u.step='sex'; await fresh("Kirim Sex: <b>M / F</b>"); }
      if(d==='set_birth'){ u.step='birth'; await fresh("Kirim Birth: <b>Agustus 2002</b>"); }
      if(d==='set_loc'){ u.step='location'; await fresh("Kirim Location: <b>Yogyakarta</b>"); }
      if(d==='set_interest'){ u.step='interest'; await fresh("Kirim Interest: <b>M / F / All</b>"); }
      if(d==='kirim'){ u.step='kirim'; await fresh(isUnl(u)?"Kirim menfess kamu sekarang.\n\n♾️ Unlimited, gratis.":`Kirim menfess kamu sekarang.\n\n🪙 Coinfes: <b>${u.coinfes}</b> | 1 Post = 200`); }
      if(d==='beli') await edit("<b>🪙 Beli Coinfes</b>\n\n2.000 Coinfes - Rp 10.000\n20.000 Coinfes - Rp 50.000\nUnlimited 2 Bulan - Rp 100.000\n\nKirim bukti ke @jogja_lend",{inline_keyboard:[[{text:"💬 Chat Admin",url:"https://t.me/jogja_lend"}],[{text:"⬅️ Kembali",callback_data:"back"}]]});
      if(d==='bantuan') await edit(bantuanText(),{inline_keyboard:[[{text:"⬅️ Kembali",callback_data:"back"}]]});
      if(d==='stop_kirim'){ u.step=null; await edit(profileText(u)); }
      return res.status(200).json({ok:true});
    }
    const msg=update.message; if(!msg) return res.status(200).json({ok:true});
    const chat_id=msg.chat.id; const u=getUser(msg.from); const text=msg.text||msg.caption||""; const isStart=text==='/start';
    if(text.startsWith('/start talk_')){ const parts=text.replace('/start talk_','').split('_'); u.step='talk_'+parts[0]+'_'+(parts[1]||'0')+'_'+(parts[2]||''); await tg('sendMessage',{chat_id,text:`💬 <b>TALK Menfess</b>\n\nKetik komen kamu, bakal muncul di grup diskusi @indo_fess.`,parse_mode:'HTML'}); return res.status(200).json({ok:true}); }
    if(text.startsWith('/start comment_')){ const parts=text.replace('/start comment_','').split('_'); u.step='talk_'+parts[0]+'_'+(parts[1]||'0')+'_'+(parts[2]||''); await tg('sendMessage',{chat_id,text:`💬 <b>TALK Menfess</b>\n\nKetik komen kamu.`,parse_mode:'HTML'}); return res.status(200).json({ok:true}); }
    if(text.startsWith('/start hitme_')||text.startsWith('/start hmu_')){ const tid=Number(text.replace('/start hitme_','').replace('/start hmu_','').split('_')[0]); if(tid===u.chat_id){ await tg('sendMessage',{chat_id,text:"😅 Itu menfess kamu sendiri!"}); return res.status(200).json({ok:true}); } await tg('sendMessage',{chat_id,text:`💞 <b>Request HITME Terkirim!</b>\n\nNunggu pengirim bales ya.`,parse_mode:'HTML',reply_markup:mainMenu()}); await tg('sendMessage',{chat_id:tid,text:`💞 <b>Ada Yang Mau HITME Kamu!</b>\n\nAda yang tertarik sama menfess kamu.\n\nTerima?`,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"✅ Terima",callback_data:`hmu_yes_${u.chat_id}`}],[{text:"❌ Tolak",callback_data:`hmu_no_${u.chat_id}`}]]}}); return res.status(200).json({ok:true}); }
    if(text.startsWith('/start who_')){ const parts=text.replace('/start who_','').split('_'); const tid=Number(parts[0]); const code=parts[1]||''; const sender=DB.get(tid); if(!sender){ await tg('sendMessage',{chat_id,text:"Pengirim gak ketemu."}); return res.status(200).json({ok:true}); } await tg('sendMessage',{chat_id,text:`💌 <b>WHO - Profil Anonim Pengirim</b>\n\n⚧️ Sex: ${sender.sex||'-'}\n🎂 Birth: ${sender.birth||'-'}\n📍 Location: ${sender.location||'-'}\n🎯 Interest: ${sender.interest||'-'}\n\nMau tau username aslinya? Udah kirim request ke pengirim.`,parse_mode:'HTML',reply_markup:mainMenu()}); await tg('sendMessage',{chat_id:tid,text:`💌 <b>Ada Yang Penasaran WHO Kamu!</b>\n\nKode: ${code}\n\nAda yang klik WHO di menfess kamu dan mau tau username asli kamu.\n\nBuka identitas?`,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"✅ Buka Identitas",callback_data:`who_yes_${u.chat_id}`}],[{text:"❌ Tetep Anonim",callback_data:`who_no_${u.chat_id}`}]]}}); return res.status(200).json({ok:true}); }
    if(text.startsWith('/start report_')){ const parts=text.replace('/start report_','').split('_'); const tid=Number(parts[0]); const code=parts[1]||''; await tg('sendMessage',{chat_id,text:`✅ <b>Report Terkirim!</b>\n\nMenfess ${code} udah dilaporin ke admin. Makasih!`,parse_mode:'HTML',reply_markup:mainMenu()}); await tg('sendMessage',{chat_id:ADMIN_ID,text:`🚨 <b>REPORT BARU</b>\n\nKode: ${code}\nPengirim ID: ${tid}\nPelapor ID: ${u.chat_id} (@${u.username||'-'})\n\nCek di @indo_fess`,parse_mode:'HTML'}); return res.status(200).json({ok:true}); }
    if(text.startsWith('/start balas_')){ const tid=text.replace('/start balas_',''); u.step='balas_'+tid; await tg('sendMessage',{chat_id,text:`💬 <b>Balas</b>\n\nKetik balasan kamu.`,parse_mode:'HTML'}); return res.status(200).json({ok:true}); }
    if(text.startsWith('/unlimited') && msg.from.id===ADMIN_ID){ const tid=text.split(' ')[1]; const t=DB.get(Number(tid)); if(!t){ await tg('sendMessage',{chat_id,text:`User ${tid} belum pernah /start.`}); return res.status(200).json({ok:true}); } const now=new Date(); const base=t.unlimited_until&&new Date(t.unlimited_until)>now?new Date(t.unlimited_until):now; base.setDate(base.getDate()+60); t.unlimited_until=base.toISOString(); await tg('sendMessage',{chat_id:Number(tid),text:"🎉 <b>Unlimited Aktif!</b>",parse_mode:'HTML',reply_markup:mainMenu()}); await tg('sendMessage',{chat_id,text:`✅ Unlimited 60 hari buat ${tid}`}); await del(chat_id,msg.message_id); return res.status(200).json({ok:true}); }
    if(text.startsWith('/add') && msg.from.id===ADMIN_ID){ const p=text.split(' '); const t=DB.get(Number(p[1])); const j=parseInt(p[2]||'0'); if(t){ t.coinfes+=j; await tg('sendMessage',{chat_id:Number(p[1]),text:`🪙 <b>+${j} Coinfes masuk!</b>`,parse_mode:'HTML',reply_markup:mainMenu()}); await tg('sendMessage',{chat_id,text:`✅ +${j} ke ${p[1]}`}); } else await tg('sendMessage',{chat_id,text:`User ${p[1]} belum pernah /start.`}); await del(chat_id,msg.message_id); return res.status(200).json({ok:true}); }
    if(isStart){ u.step=null; await tg('sendMessage',{chat_id,text:profileText(u),parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
    if(['sex','birth','location','interest'].includes(u.step)){ if(u.step==='sex')u.sex=text; if(u.step==='birth')u.birth=text; if(u.step==='location')u.location=text; if(u.step==='interest')u.interest=text; u.step=null; await del(chat_id,msg.message_id); await tg('sendMessage',{chat_id,text:"✅ Disimpan.",parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
    if(u.step && u.step.startsWith('talk_')){
      const parts=u.step.replace('talk_','').split('_'); const tid=Number(parts[0]); const postId=Number(parts[1]||0); const code=parts[2]||''; u.step=null; await del(chat_id,msg.message_id);
      await tg('sendMessage',{chat_id:GROUP_ID,text:`💬 <b>TALK Anonim (${code}):</b>\n\n${text}`,parse_mode:'HTML'});
      await tg('sendMessage',{chat_id:tid,text:`💬 <b>Ada TALK Baru!</b>\n\n"${text}"\n\nCek di grup diskusi @indo_fess!`,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"👀 Lihat",url:"https://t.me/indo_fess"}]]}});
      await tg('sendMessage',{chat_id,text:`✅ <b>TALK terkirim ke grup diskusi!</b>`,parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true});
    }
    if(u.step && u.step.startsWith('balas_')){ const tid=Number(u.step.replace('balas_','')); u.step=null; await del(chat_id,msg.message_id); await tg('sendMessage',{chat_id:tid,text:`💬 <b>Ada Balasan!</b>\n\n"${text}"`,parse_mode:'HTML'}); await tg('sendMessage',{chat_id,text:`✅ <b>Balasan terkirim!</b>`,parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
    if(u.step!=='kirim'){ if(text.startsWith('/')) return res.status(200).json({ok:true}); await del(chat_id,msg.message_id); await tg('sendMessage',{chat_id,text:"Klik dulu <b>Kirim Menfess</b>.",parse_mode:'HTML',reply_markup:mainMenu()}); return res.status(200).json({ok:true}); }
    const unl=isUnl(u);
    if(!unl && u.coinfes<200){ await del(chat_id,msg.message_id); await tg('sendMessage',{chat_id,text:`❌ <b>Coinfes Habis!</b>\n\nCoinfes: <b>${u.coinfes}</b>`,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"🪙 Beli Coinfes",callback_data:"beli"}]]}}); return res.status(200).json({ok:true}); }
    let fid=null,type='text'; if(msg.photo){ type='photo'; fid=msg.photo[msg.photo.length-1].file_id; } if(msg.video){ type='video'; fid=msg.video.file_id; }
    if(!text && type==='text') return res.status(200).json({ok:true});
    globalThis.COUNTER++; const num=globalThis.COUNTER; const code=makeCode();
    const cap=type==='text'?`${text}\n\n👤 #M${num} ✓💎💎\n\n📌 Register ke @${BOT_USERNAME} untuk bergabung!\n-${code}`:`${text?text+"\n\n":""}👤 #M${num} ✓💎💎\n\n📌 Register ke @${BOT_USERNAME} untuk bergabung!\n-${code}`;
    let r; if(type==='text') r=await tg('sendMessage',{chat_id:CHANNEL_ID,text:cap}); if(type==='photo') r=await tg('sendPhoto',{chat_id:CHANNEL_ID,photo:fid,caption:cap}); if(type==='video') r=await tg('sendVideo',{chat_id:CHANNEL_ID,video:fid,caption:cap});
    if(r?.ok){
      if(!unl) u.coinfes-=200;
      const postId=r.result.message_id; POSTS.set(postId,{sender:u.chat_id,code,num});
      const interBtn={inline_keyboard:[[{text:"💞 HITME",url:`https://t.me/${BOT_USERNAME}?start=hitme_${u.chat_id}_${code}`},{text:"💌 WHO",url:`https://t.me/${BOT_USERNAME}?start=who_${u.chat_id}_${code}`}],[{text:"💬 TALK",url:`https://t.me/${BOT_USERNAME}?start=talk_${u.chat_id}_${postId}_${code}`},{text:"❗ Report",url:`https://t.me/${BOT_USERNAME}?start=report_${u.chat_id}_${code}`}]]};
      await tg('sendMessage',{chat_id:GROUP_ID,text:`INTERAKSI MENFESS INDO FESS`,reply_markup:interBtn});
      await del(chat_id,msg.message_id); await tg('sendMessage',{chat_id,text:`✅ <b>Terkirim!</b>\n\n👤 #M${num}\nKode: ${code}\n${unl?'♾️ Unlimited - Gratis':`🪙 Sisa: <b>${u.coinfes}</b>`}`,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"👀 Lihat di Channel",url:"https://t.me/indo_fess"}],[{text:"🛑 Berhenti",callback_data:"stop_kirim"}]]}});
    }
    else await tg('sendMessage',{chat_id,text:`❌ Gagal post: ${r?.description||'Bot belum jadi admin di @indo_fess?'}`,parse_mode:'HTML'});
    return res.status(200).json({ok:true});
  }catch(e){ console.log(e); return res.status(200).json({ok:true}); }
  }
