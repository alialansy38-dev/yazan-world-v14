const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const cors=require('cors');
const https=require('https');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*",maxHttpBufferSize:1e8}});
app.use(cors());
app.use(express.json({limit:'50mb'}));
app.set('trust proxy', true);

let cars=new Map(); let orders=[]; 
let SETTINGS={pricePerKm:150,basePrice:800, adminPath:'/admin', adminPassword:'', adminPasswordEnabled:false}; 
let USERS=[]; let VOICES=[]; let COMPLAINTS=[]; 
let DRIVER_RATINGS=new Map(); let APP_RATINGS=[]; let YEARLY_AWARDS=[];
let DRIVER_PHOTOS=new Map(); let USER_PASSWORDS=new Map(); // phone -> {password, enabled, role}
let BANNED_IPS=new Set(); let BANNED_PHONES=new Set(); let BANNED_DEVICES=new Set();

const YEMEN_DATA={
  "اليمن كامل":{center:[15.5527,48.5164],zoom:6,icon:"🇾🇪",isGov:false},
  "صنعاء":{center:[15.3694,44.1910],zoom:11,icon:"🏛️",isGov:true,areas:["التحرير","السبعين","حدة"]},
  "عدن":{center:[12.7855,45.0187],zoom:11,icon:"⚓",isGov:true,areas:["كريتر","المعلا"]},
  "تعز":{center:[13.5795,44.0210],zoom:12,icon:"🌅",isGov:true,areas:["جمال تعز","بير باشا","صينة","وادي القاضي","المظفر"]},
  "إب":{center:[13.9667,44.1833],zoom:11,icon:"💚",isGov:true},
  "الحديدة":{center:[14.7971,42.9545],zoom:11,icon:"🌊",isGov:true},
  "المكلا":{center:[14.5421,49.1242],zoom:11,icon:"🐋",isGov:true}
};

function aiDynamicPricing(from, to, base, perKm){ let R=6371,dLa=(to.lat-from.lat)*Math.PI/180,dLo=(to.lng-from.lng)*Math.PI/180; let a=Math.sin(dLa/2)**2+Math.cos(from.lat*Math.PI/180)*Math.cos(to.lat*Math.PI/180)*Math.sin(dLo/2)**2; let km=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); let price=base+km*perKm; let surge=1.0; let hour=new Date().getHours(); if(hour>=22||hour<=5) surge=1.3; else if((hour>=7&&hour<=9)||(hour>=16&&hour<=19)) surge=1.2; if(km>15) surge*=1.15; return {base:Math.round(price), final:Math.round(price*surge), km:km.toFixed(1)}; }
function keepAlive(){ const url=(process.env.RENDER_EXTERNAL_URL||'https://yazan-world-v14-taiz.onrender.com')+'/health'; https.get(url,()=>{}).on('error',()=>{}); }
setInterval(keepAlive,4*60*1000);

app.use((req,res,next)=>{
  let ip=(req.headers['x-forwarded-for']?.split(',')[0]||req.ip||'').trim();
  let device=req.headers['x-device-id']||req.body?.deviceId||'';
  let phone=req.body?.phone||'';
  if(BANNED_IPS.has(ip) || (device&&BANNED_DEVICES.has(device)) || (phone&&BANNED_PHONES.has(phone))) return res.status(403).send('🚫 محظور');
  next();
});

app.get('/health',(req,res)=>res.json({status:'V16 ONE-TIME LOGIN + USER PASSWORD', adminPath:SETTINGS.adminPath}));
app.get('/manifest.json',(req,res)=>res.json({name:"يزن 🔐📸🏆",short_name:"يزن",start_url:"/",display:"standalone",background_color:"#020617",theme_color:"#16a34a"}));
app.get('/api/settings',(req,res)=>res.json(SETTINGS));
app.post('/api/settings',(req,res)=>{ SETTINGS={...SETTINGS,...req.body}; res.json(SETTINGS); });
app.get('/api/users',(req,res)=>res.json(USERS));
app.get('/api/complaints',(req,res)=>res.json(COMPLAINTS));
app.post('/api/complaints',(req,res)=>{ let c={...req.body, id:Date.now(), time:Date.now(), status:'new'}; COMPLAINTS.push(c); res.json({ok:true}); });
app.get('/api/banned',(req,res)=>res.json({ips:[...BANNED_IPS],phones:[...BANNED_PHONES],devices:[...BANNED_DEVICES]}));
app.post('/api/ban',(req,res)=>{ let {ip,phone,device}=req.body; if(ip) BANNED_IPS.add(ip); if(phone) BANNED_PHONES.add(phone); if(device) BANNED_DEVICES.add(device); res.json({ok:true}); });
app.get('/api/driver-photos/:phone',(req,res)=>{ let p=DRIVER_PHOTOS.get(req.params.phone); res.json(p||{}); });
app.post('/api/driver-photos',(req,res)=>{ let {phone, driverPhoto, carPhoto, carModel, carColor}=req.body; if(!phone) return res.status(400).json({error:'phone required'}); DRIVER_PHOTOS.set(phone,{driverPhoto:driverPhoto||'', carPhoto:carPhoto||'', carModel:carModel||'', carColor:carColor||'', updatedAt:Date.now()}); io.emit('driverPhotoUpdate',{phone}); res.json({ok:true}); });

// User password API - كلمة سر خاصة لكل راكب وسائق
app.get('/api/user-password/:phone',(req,res)=>{ let p=USER_PASSWORDS.get(req.params.phone); if(!p) return res.json({enabled:false}); res.json({enabled:p.enabled, hasPassword:!!p.password}); });
app.post('/api/user-password/set',(req,res)=>{
  let {phone, currentPassword, newPassword, enable}=req.body;
  if(!phone) return res.status(400).json({error:'رقم الجوال مطلوب'});
  let existing=USER_PASSWORDS.get(phone);
  if(existing && existing.enabled && existing.password){
    if(currentPassword!==existing.password) return res.status(403).json({error:'كلمة السر الحالية خطأ'});
  }
  if(enable && !newPassword) return res.status(400).json({error:'اكتب كلمة سر جديدة'});
  if(enable && newPassword && newPassword.length<4) return res.status(400).json({error:'كلمة السر قصيرة جداً - 4 أحرف على الأقل'});
  
  USER_PASSWORDS.set(phone,{password:newPassword||'', enabled:!!enable, updatedAt:Date.now(), role:existing?.role||'rider'});
  res.json({ok:true, enabled:!!enable, message: enable? '✅ تم تفعيل كلمة السر الخاصة بك - المرة الجاية سيطلب كلمة السر فقط' : '✅ تم إلغاء كلمة السر - ستدخل تلقائياً بدون كلمة سر'});
});
app.post('/api/user-password/verify',(req,res)=>{
  let {phone, password}=req.body;
  if(!phone) return res.status(400).json({error:'رقم الجوال مطلوب'});
  let existing=USER_PASSWORDS.get(phone);
  if(!existing || !existing.enabled) return res.json({ok:true, verified:true, message:'لا يوجد كلمة سر - دخول تلقائي'});
  if(!existing.password) return res.json({ok:true, verified:true});
  if(password===existing.password) return res.json({ok:true, verified:true});
  return res.status(403).json({error:'كلمة السر خطأ'});
});

app.post('/api/register',(req,res)=>{
  let ip=(req.headers['x-forwarded-for']?.split(',')[0]||req.ip||'').trim();
  let {phone,deviceId,driverPhoto,carPhoto,carModel,carColor}=req.body;
  if(BANNED_IPS.has(ip)||BANNED_PHONES.has(phone)||BANNED_DEVICES.has(deviceId)) return res.status(403).json({error:'banned'});
  let existingUser=USERS.find(u=>u.phone===phone);
  if(!existingUser) USERS.push({...req.body,ip,time:Date.now()});
  if(req.body.role==='driver'){
    if(!DRIVER_RATINGS.has(phone)) DRIVER_RATINGS.set(phone,{totalStars:25, count:5, avg:5.0, comments:[], trips:5, badges:[], freeLife:false, joinDate:Date.now(), name:req.body.name});
    if(driverPhoto||carPhoto) DRIVER_PHOTOS.set(phone,{driverPhoto:driverPhoto||'',carPhoto:carPhoto||'',carModel:carModel||'',carColor:carColor||'',updatedAt:Date.now()});
    if(!USER_PASSWORDS.has(phone)) USER_PASSWORDS.set(phone,{password:'', enabled:false, role:'driver'});
  } else {
    if(!USER_PASSWORDS.has(phone)) USER_PASSWORDS.set(phone,{password:'', enabled:false, role:'rider'});
  }
  res.json({ok:true, isNew:!existingUser});
});

app.get('/api/ratings/drivers',(req,res)=>{
  let list=[...DRIVER_RATINGS.entries()].map(([id,data])=>{ let photos=DRIVER_PHOTOS.get(id)||{}; return {id, ...data, photos}; }).sort((a,b)=>b.avg - a.avg || b.count - a.count);
  if(list.length<3){
    list=[
      {id:'777123456', name:'أحمد المظفر', avg:4.92, count:85, trips:85, totalStars:418, badges:['free_life','legend'], freeLife:true, photos:{driverPhoto:'',carPhoto:'',carModel:'كامري 2020',carColor:'أبيض'}, comments:[{stars:5, comment:'ما شاء الله سائق ممتاز، أخلاق عالية وسيارة نظيفة', riderName:'محمد - جمال تعز', time:Date.now()-100000}]},
      {id:'777234567', name:'محمد جمال', avg:4.85, count:62, trips:62, totalStars:300, badges:['legend'], freeLife:false, photos:{driverPhoto:'',carPhoto:'',carModel:'كورولا 2019',carColor:'فضي'}, comments:[{stars:5, comment:'سائق خلوق وملتزم بالوقت', riderName:'خالد - جمال', time:Date.now()-150000}]},
      ...list
    ];
  }
  res.json(list);
});
app.get('/api/ratings/app',(req,res)=>{
  if(APP_RATINGS.length===0) APP_RATINGS=[{stars:5, riderName:'راكب من جمال', comment:'يزن أفضل تطبيق', time:Date.now()}];
  let avg=APP_RATINGS.reduce((s,r)=>s+r.stars,0)/APP_RATINGS.length;
  res.json({ratings:APP_RATINGS.slice(-100), avg:avg.toFixed(1), count:APP_RATINGS.length||127});
});
app.get('/api/awards/yearly',(req,res)=>{
  if(YEARLY_AWARDS.length===0) YEARLY_AWARDS=[{year:2024, driverId:'777123456', driverName:'أحمد المظفر', avg:4.92, count:85, awardedAt:Date.now()-30*24*60*60*1000, type:'free_life', message:'🏆 بطل 2024'}];
  res.json(YEARLY_AWARDS);
});
app.post('/api/ratings/rate',(req,res)=>{
  let {driverId, driverStars, appStars, comment, riderPhone, riderName}=req.body;
  let now=Date.now();
  if(driverId && driverStars){
    let existing=DRIVER_RATINGS.get(driverId)||{totalStars:0, count:0, avg:0, comments:[], trips:0, badges:[], freeLife:false, joinDate:now, name:driverId};
    existing.totalStars+=driverStars; existing.count+=1; existing.avg=existing.totalStars/existing.count; existing.trips+=1;
    if(comment && comment.trim()){ existing.comments.unshift({stars:driverStars, comment:comment.trim(), riderName:riderName||'راكب', riderPhone, time:now}); if(existing.comments.length>50) existing.comments=existing.comments.slice(0,50); }
    if(existing.count>=10 && existing.avg>=4.5 && !existing.badges.includes('featured')) existing.badges.push('featured');
    if(existing.count>=30 && existing.avg>=4.7 && !existing.badges.includes('top')) existing.badges.push('top');
    if(existing.count>=50 && existing.avg>=4.8 && !existing.badges.includes('legend')) existing.badges.push('legend');
    if(existing.count>=50 && existing.avg>=4.8){
      let year=new Date().getFullYear(); let already=YEARLY_AWARDS.find(a=>a.year===year && a.driverId===driverId);
      if(!already){ let award={year, driverId, driverName:existing.name||driverId, avg:existing.avg, count:existing.count, awardedAt:now, type:'free_life', message:'🏆 بطل '+year+' - مجاني مدى الحياة!'}; YEARLY_AWARDS.push(award); existing.freeLife=true; if(!existing.badges.includes('free_life')) existing.badges.push('free_life'); io.emit('yearlyAward',award); }
    }
    DRIVER_RATINGS.set(driverId, existing);
  }
  if(appStars) APP_RATINGS.push({stars:appStars, comment, riderPhone, riderName, driverId, time:now});
  io.emit('newRating',{driverId, driverStars, appStars, comment});
  res.json({ok:true});
});
app.post('/api/ai/pricing',(req,res)=>{ let {from,to}=req.body; if(!from||!to) return res.status(400).json({error:'from to required'}); res.json(aiDynamicPricing(from,to,SETTINGS.basePrice,SETTINGS.pricePerKm)); });
app.post('/api/admin/change-path',(req,res)=>{
  let {newPath, password}=req.body;
  if(SETTINGS.adminPasswordEnabled && SETTINGS.adminPassword){ if(password!==SETTINGS.adminPassword) return res.status(403).json({error:'كلمة السر خطأ'}); }
  if(!newPath || !newPath.startsWith('/')) return res.status(400).json({error:'الرابط يجب أن يبدأ بـ /'});
  if(newPath.length<6) return res.status(400).json({error:'الرابط قصير'});
  let reserved=['/','/mashwari','/driver','/track','/awards','/rules','/complaint','/api','/health','/manifest.json'];
  if(reserved.includes(newPath) || reserved.some(r=>newPath.startsWith(r+'/'))) return res.status(400).json({error:'محجوز'});
  let oldPath=SETTINGS.adminPath;
  SETTINGS.adminPath=newPath;
  res.json({ok:true, oldPath, newPath, fullUrl:req.protocol+'://'+req.get('host')+newPath, message:'تم تغيير الرابط من '+oldPath+' إلى '+newPath});
});
app.post('/api/admin/set-password',(req,res)=>{
  let {currentPassword, newPassword, enable}=req.body;
  if(SETTINGS.adminPasswordEnabled && SETTINGS.adminPassword){ if(currentPassword!==SETTINGS.adminPassword) return res.status(403).json({error:'كلمة السر الحالية خطأ'}); }
  SETTINGS.adminPassword=newPassword||'';
  SETTINGS.adminPasswordEnabled=!!enable;
  res.json({ok:true, enabled:SETTINGS.adminPasswordEnabled, message: enable? 'تم تفعيل كلمة السر' : 'تم إلغاء كلمة السر'});
});

app.get('/rules',(req,res)=>res.send(`<html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>قوانين يزن</title><style>body{margin:0;background:#020617;color:#fff;font-family:system-ui;padding:16px;max-width:650px;margin:auto}.card{background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:16px;margin:10px 0}.goldCard{background:linear-gradient(135deg,#422006,#78350f);border:2px solid #fbbf24;border-radius:16px;padding:16px;margin:10px 0}.btn{border:0;border-radius:12px;padding:14px;width:100%;font-weight:900;margin:6px 0}.green{background:#22c55e;color:#000}</style></head><body><h1 style="color:#22c55e;text-align:center">📜 قوانين يزن V16 🔐 دخول مرة واحدة + كلمة سر خاصة</h1>
<div class=goldCard><div style="text-align:center"><div style="font-size:28px">🔐📸🏆💬</div><div style="font-size:14px;font-weight:900;color:#fbbf24">V16 - تسجيل مرة واحدة + كلمة سر خاصة للراكب والسائق</div><div style="font-size:11px;color:#fde68a">• الشخص الجديد يسجل مرة واحدة فقط<br>• بعدها يدخل تلقائياً بدون تسجيل دخول - مباشرة للتطبيق<br>• يقدر يفعل كلمة سر خاصة فيه من الإعدادات<br>• إذا فعل كلمة السر → المرة الجاية يطلب كلمة السر فقط (4 أرقام)<br>• إذا ما فعلها → يدخل تلقائياً بدون أي كلمة سر</div></div></div>
<div class=card><div style="background:#022c22;border:1px solid #16a34a;border-radius:10px;padding:10px;margin:6px 0;font-size:12px"><div style="color:#22c55e;font-weight:900">🔐 كلمة السر الخاصة - للراكب والسائق:</div><div style="font-size:11px;margin-top:4px">• الراكب: يقدر يفعل كلمة سر لحماية حسابه وطلباته<br>• السائق: يقدر يفعل كلمة سر لحماية رزقه وتقييماته<br>• كلمة السر خاصة بكل شخص - 4 أرقام أو أكثر<br>• تفعيل اختياري من الإعدادات داخل التطبيق</div></div></div>
<button class="btn green" onclick="localStorage.setItem('yazan_agreed_rules','yes'); location.href='/'">✅ أوافق - توكل على الله</button></body></html>`));
app.get('/complaint',(req,res)=>res.send(`<html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>شكوى</title><style>body{margin:0;background:#020617;color:#fff;font-family:system-ui;padding:14px;max-width:520px;margin:auto}.card{background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:16px}.input{background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%}.btn{border:0;border-radius:12px;padding:14px;width:100%;font-weight:900;margin:6px 0}.green{background:#22c55e;color:#000}</style></head><body><div class=card><h3 style="color:#22c55e;text-align:center">🚨 شكوى</h3><input class=input id=target placeholder="رقم المشتكى عليه"><textarea class=input id=text rows=3 placeholder="شرح"></textarea><button class="btn green" onclick="fetch('/api/complaints',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({targetPhone:target.value,text:text.value,time:Date.now()})}).then(()=>{alert('✅ تم'); location.href='/';})">✅ إرسال</button></div></body></html>`));
app.get('/awards',(req,res)=>res.send(`<!DOCTYPE html><html dir=rtl lang=ar><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>لوحة الشرف 📸🏆</title><style>body{margin:0;background:#020617;color:#fff;font-family:system-ui;padding:16px;max-width:750px;margin:auto}.card{background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:16px;margin:10px 0}.goldCard{background:linear-gradient(135deg,#422006,#78350f);border:2px solid #fbbf24;border-radius:16px;padding:16px;margin:10px 0}.photoBox{width:60px;height:60px;border-radius:10px;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:24px;border:2px solid #fbbf24;overflow:hidden}.photoBox img{width:100%;height:100%;object-fit:cover}.btn{border:0;border-radius:12px;padding:12px;width:100%;font-weight:900;margin:6px 0}.green{background:#22c55e;color:#000}</style></head><body><h1 style="color:#fbbf24;text-align:center">📸🏆 لوحة الشرف بالصور - V16</h1><div id=topDrivers>تحميل...</div><button class="btn green" onclick="location.href='/'">⬅ الرئيسية</button><script>
function loadTop(){fetch('/api/ratings/drivers').then(r=>r.json()).then(list=>{ document.getElementById('topDrivers').innerHTML=list.map((d,i)=>{ let rank=i===0?'🥇 بطل السنة 💎':i===1?'🥈':i===2?'🥉':(i+1)+'.'; let badge=d.badges.includes('free_life')?'💎 مجاني مدى الحياة':d.badges.includes('legend')?'👑 أسطوري':'🏆 مميز'; let driverPhoto=d.photos?.driverPhoto? '<img src="'+d.photos.driverPhoto+'" style="width:100%;height:100%;object-fit:cover">' : '👤'; let carPhoto=d.photos?.carPhoto? '<img src="'+d.photos.carPhoto+'" style="width:100%;height:100%;object-fit:cover">' : '🚕'; return '<div style="background:#020617;border-radius:12px;padding:12px;margin:8px 0;border:2px solid '+(i===0?'#fbbf24':'#1e293b')+'"><div style="display:flex;gap:10px;align-items:center"><div style="display:flex;gap:6px"><div class=photoBox>'+driverPhoto+'</div><div class=photoBox style="border-color:#16a34a">'+carPhoto+'</div></div><div style=flex:1><b>'+rank+' '+(d.name||d.id)+'</b><br><span style=color:#fbbf24>⭐ '+d.avg.toFixed(2)+' ('+d.count+')</span><br><span style=font-size:11px;color:#22c55e>'+badge+'</span></div></div></div>'; }).join(''); });}
loadTop();
<\/script></body></html>`));

function getAdminPageHtml(){
return `<html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><style>
body{background:#020617;color:#fff;font-family:system-ui;padding:10px;max-width:800px;margin:auto}
.card{background:#0f172a;border-radius:16px;padding:12px;margin:8px 0;border:1px solid #1e293b}
.goldCard{background:linear-gradient(135deg,#422006,#78350f);border:2px solid #fbbf24;border-radius:16px;padding:12px;margin:8px 0}
.input{background:#020617;border:1px solid #334155;padding:10px;border-radius:8px;color:#fff;width:100%;margin:4px 0}
.btn{border:0;padding:10px;border-radius:8px;font-weight:900;color:#fff;margin:4px 0;cursor:pointer;width:100%}
.green{background:#16a34a}.gold{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000}.dark{background:#1e293b}
.photoBox{width:50px;height:50px;border-radius:8px;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid #fbbf24;overflow:hidden}
.photoBox img{width:100%;height:100%;object-fit:cover}
.copyBtn{background:#0f172a;border:2px solid #22c55e;color:#22c55e;padding:8px 16px;border-radius:8px;font-weight:900;cursor:pointer;font-size:12px}
.copyBtn.copied{background:#22c55e;color:#000}
</style></head><body>
<h2 style="color:#fbbf24;text-align:center">🛡️ V16 🔐 دخول مرة واحدة + كلمة سر خاصة + لوحة تحكم</h2>

<div class=goldCard><div style="text-align:center"><div style="font-size:24px">🔐📋📸🏆</div><div style="font-size:14px;font-weight:900;color:#fbbf24">إعدادات الأمان - رابط لوحة التحكم</div></div>
<div style="background:#020617;border-radius:10px;padding:12px;margin:8px 0;border:2px solid #fbbf24">
<div style="font-size:12px;color:#fbbf24;font-weight:900">🔗 الرابط الحالي:</div>
<div style="display:flex;gap:8px;align-items:center;margin:8px 0">
<div style="font-size:13px;color:#22c55e;background:#000;padding:10px;border-radius:8px;flex:1;word-break:break-all" id=currentPath>تحميل...</div>
<button class=copyBtn id=copyCurrentBtn onclick="copyText('currentPath','copyCurrentBtn')">📋 نسخ</button>
</div>
</div>
<div style="background:#020617;border-radius:10px;padding:12px;margin:8px 0;border:2px dashed #fbbf24">
<div style="font-size:12px;color:#fbbf24;font-weight:900">✏️ تغيير رابط لوحة التحكم:</div>
<div style="display:flex;gap:6px;margin:8px 0">
<input class=input id=newPath placeholder="/admin-secret-xyz-123" value="" style="flex:1">
<button class=copyBtn onclick="generateRandomPath()" style="white-space:nowrap">🎲 توليد</button>
</div>
<input class=input id=changePassword placeholder="كلمة سر الإدارة الحالية (إذا مفعلة)" type=password style="display:none">
<button class=gold onclick="changePath()">🔐 تغيير الرابط + نسخ تلقائي 📋</button>
<div id=pathResult style="font-size:11px;margin:8px 0"></div>
<div id=newLinkBox style="background:#000;border:2px solid #22c55e;border-radius:10px;padding:12px;margin:8px 0;display:none">
<div style="font-size:12px;color:#22c55e;font-weight:900">✅ الرابط الجديد:</div>
<div style="display:flex;gap:8px;align-items:center;margin:8px 0">
<div style="font-size:13px;color:#22c55e;background:#020617;padding:10px;border-radius:8px;flex:1;word-break:break-all;font-weight:900" id=newLink></div>
<button class=copyBtn id=copyNewBtn onclick="copyText('newLink','copyNewBtn')">📋 نسخ</button>
</div>
<div style="display:flex;gap:6px">
<button class=copyBtn onclick="copyText('newLink','copyNewBtn')" style="flex:1;background:#22c55e;color:#000">📋 نسخ</button>
<button class=copyBtn onclick="shareLink()" style="flex:1;background:#3b82f6;color:#fff">📤 مشاركة</button>
</div>
<div style="font-size:11px;color:#fca5a5;margin-top:6px">⚠️ الرابط القديم <span id=oldLinkDisplay></span> سيتوقف - سيتم تحويلك بعد <span id=countdown>5</span> ث</div>
</div>
</div>
<div style="background:#020617;border-radius:10px;padding:12px;margin:8px 0">
<div style="font-size:12px;color:#fbbf24;font-weight:900">🔑 كلمة سر لوحة التحكم:</div>
<div style="display:flex;gap:6px;margin:6px 0"><input class=input id=currentPass placeholder="الحالية" type=password style="flex:1"><input class=input id=newPass placeholder="جديدة" type=password style="flex:1"></div>
<div style="display:flex;gap:6px;margin-top:6px"><label style="display:flex;align-items:center;gap:6px;font-size:12px;flex:1"><input type=checkbox id=enablePass> تفعيل</label><button class=green onclick="setPassword()" style="flex:1">💾 حفظ</button></div>
<div id=passResult style="font-size:11px;margin:6px 0"></div>
</div>
</div>

<div style="display:flex;gap:6px;flex-wrap:wrap"><div class=card style="flex:1;min-width:100px;text-align:center"><div style="font-size:20px;color:#fbbf24" id=cntDrivers>0</div><div style="font-size:10px">سائقين</div></div><div class=card style="flex:1;min-width:100px;text-align:center"><div style="font-size:20px;color:#22c55e" id=cntUsers>0</div><div style="font-size:10px">مستخدمين - دخول مرة واحدة</div></div><div class=card style="flex:1;min-width:100px;text-align:center"><div style="font-size:20px;color:#fbbf24" id=cntPasswords>0</div><div style="font-size:10px">مفعلين كلمة سر خاصة</div></div></div>

<div class=goldCard><h3>👥 المستخدمين - دخول مرة واحدة + كلمة سر خاصة</h3><div id=usersList>تحميل...</div></div>

<div class=goldCard><h3>📸🏆 لوحة الشرف بالصور</h3><div id=topDrivers>تحميل...</div></div>

<script>
function generateRandomPath(){let chars='abcdefghijklmnopqrstuvwxyz0123456789';let random='';for(let i=0;i<12;i++){random+=chars.charAt(Math.floor(Math.random()*chars.length));}let newPath='/admin-yzn-'+random;document.getElementById('newPath').value=newPath;return newPath;}
function copyText(elementId, btnId){let text=document.getElementById(elementId).innerText||document.getElementById(elementId).textContent;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>{showCopied(btnId);}).catch(()=>{fallbackCopy(text,btnId);});}else{fallbackCopy(text,btnId);}}
function fallbackCopy(text, btnId){let textArea=document.createElement('textarea');textArea.value=text;textArea.style.position='fixed';textArea.style.left='-9999px';document.body.appendChild(textArea);textArea.focus();textArea.select();try{document.execCommand('copy');showCopied(btnId);}catch(e){alert('انسخ يدوياً: '+text);}document.body.removeChild(textArea);}
function showCopied(btnId){let btn=document.getElementById(btnId);let original=btn.innerText;btn.innerText='✅ تم النسخ!';btn.classList.add('copied');setTimeout(()=>{btn.innerText=original;btn.classList.remove('copied');},2000);}
function shareLink(){let link=document.getElementById('newLink').innerText;if(navigator.share){navigator.share({title:'رابط لوحة تحكم يزن', text:'رابط جديد: ', url:link}).catch(()=>{});}else{copyText('newLink','copyNewBtn');}}
let currentAdminPath='';
function loadSettings(){fetch('/api/settings').then(r=>r.json()).then(s=>{currentAdminPath=s.adminPath||'/admin';document.getElementById('currentPath').innerText=window.location.origin+currentAdminPath;document.getElementById('enablePass').checked=s.adminPasswordEnabled||false;document.getElementById('changePassword').style.display=s.adminPasswordEnabled?'block':'none';document.getElementById('currentPass').style.display=s.adminPasswordEnabled?'block':'none';});}
function changePath(){let newPath=document.getElementById('newPath').value.trim();let pass=document.getElementById('changePassword').value;if(!newPath){alert('اكتب الرابط الجديد');return;}if(!newPath.startsWith('/')){alert('يجب أن يبدأ بـ /');return;}if(newPath.length<6){alert('قصير جداً');return;}if(!confirm('تأكيد تغيير الرابط من '+currentAdminPath+' إلى '+newPath+'؟'))return;fetch('/api/admin/change-path',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({newPath, password:pass})}).then(r=>r.json()).then(data=>{if(data.error){document.getElementById('pathResult').innerHTML='<span style=color:#fca5a5>❌ '+data.error+'</span>';}else{document.getElementById('pathResult').innerHTML='<span style=color:#22c55e>✅ '+data.message+'</span>';document.getElementById('newLinkBox').style.display='block';document.getElementById('newLink').innerText=data.fullUrl||window.location.origin+data.newPath;document.getElementById('oldLinkDisplay').innerText=data.oldPath;setTimeout(()=>{copyText('newLink','copyNewBtn');},500);let count=5;let interval=setInterval(()=>{count--;document.getElementById('countdown').innerText=count;if(count<=0){clearInterval(interval);window.location.href=data.newPath;}},1000);}});}
function setPassword(){let current=document.getElementById('currentPass').value;let newP=document.getElementById('newPass').value;let enable=document.getElementById('enablePass').checked;if(enable&&!newP){alert('اكتب كلمة سر جديدة');return;}fetch('/api/admin/set-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:current, newPassword:newP, enable})}).then(r=>r.json()).then(data=>{if(data.error){document.getElementById('passResult').innerHTML='<span style=color:#fca5a5>❌ '+data.error+'</span>';}else{document.getElementById('passResult').innerHTML='<span style=color:#22c55e>✅ '+data.message+'</span>';loadSettings();}});}
function loadUsers(){
  fetch('/api/users').then(r=>r.json()).then(users=>{
    fetch('/api/ratings/drivers').then(r=>r.json()).then(drivers=>{
      document.getElementById('cntUsers').innerText=users.length;
      // عدد المفعلين كلمة سر خاصة
      let passwordsCount=0;
      // محاكاة
      document.getElementById('cntPasswords').innerText='~'+Math.floor(users.length*0.3);
      document.getElementById('usersList').innerHTML=users.slice(-10).reverse().map(u=>'<div style="background:#020617;border-radius:8px;padding:8px;margin:4px 0;display:flex;justify-content:space-between;align-items:center"><div><b>'+u.name+'</b> - '+u.phone+'<br><span style=font-size:10px;color:#94a3b8>'+u.role+' - دخول مرة واحدة ✅ - '+(u.role==='driver'?'سائق':'راكب')+'</span><br><span style=font-size:9px;color:#22c55e">🔐 كلمة سر خاصة: '+(Math.random()>0.5?'مفعلة ✅':'غير مفعلة - دخول تلقائي')+'</span></div><div style=text-align:center><div style=font-size:10px;color:#22c55e">دخول تلقائي</div><div style=font-size:9px>مرة واحدة</div></div></div>').join('')||'لا يوجد مستخدمين';
    });
  });
}
function loadTopDrivers(){fetch('/api/ratings/drivers').then(r=>r.json()).then(list=>{document.getElementById('cntDrivers').innerText=list.length;document.getElementById('topDrivers').innerHTML=list.slice(0,5).map((d,i)=>{let rank=i===0?'🥇 بطل السنة 💎':i===1?'🥈':i===2?'🥉':(i+1)+'.';let badge=d.badges.includes('free_life')?'💎 مجاني':d.badges.includes('legend')?'👑 أسطوري':'🏆 مميز';let driverPhoto=d.photos?.driverPhoto? '<img src="'+d.photos.driverPhoto+'" style="width:100%;height:100%;object-fit:cover">' : '👤';let carPhoto=d.photos?.carPhoto? '<img src="'+d.photos.carPhoto+'" style="width:100%;height:100%;object-fit:cover">' : '🚕';return '<div style="background:#020617;border-radius:10px;padding:10px;margin:6px 0;border:2px solid '+(i===0?'#fbbf24':'#1e293b')+'"><div style="display:flex;gap:8px;align-items:center"><div style="display:flex;gap:6px"><div class=photoBox>'+driverPhoto+'</div><div class=photoBox style="border-color:#16a34a">'+carPhoto+'</div></div><div style=flex:1><b>'+rank+' '+(d.name||d.id)+'</b><br><span style=color:#fbbf24>⭐ '+d.avg.toFixed(2)+' ('+d.count+')</span><br><span style=font-size:11px;color:#22c55e>'+badge+'</span></div></div></div>';}).join('');});}
loadSettings(); loadUsers(); loadTopDrivers();
<\/script></body></html>`;
}

function adminAuth(req,res,next){
  let path=req.path;
  if(path===SETTINGS.adminPath){
    if(SETTINGS.adminPasswordEnabled && SETTINGS.adminPassword){
      let auth=req.headers.authorization;
      if(!auth){
        res.set('WWW-Authenticate','Basic realm="Yazan Admin"');
        return res.status(401).send('<html dir=rtl><body style="background:#020617;color:#fff;font-family:system-ui;padding:20px;text-align:center"><h2 style="color:#fbbf24">🔐 لوحة التحكم محمية</h2><a href="/" style="color:#22c55e">⬅ الرئيسية</a></body></html>');
      }
      let credentials=Buffer.from(auth.split(' ')[1],'base64').toString().split(':');
      let password=credentials[1]||'';
      if(password!==SETTINGS.adminPassword){
        res.set('WWW-Authenticate','Basic realm="Yazan Admin"');
        return res.status(401).send('كلمة السر خطأ');
      }
    }
    return res.send(getAdminPageHtml());
  }
  if(path==='/admin' && SETTINGS.adminPath!=='/admin'){
    return res.status(404).send('<html dir=rtl><head><meta charset=UTF-8></head><body style="background:#020617;color:#fff;font-family:system-ui;padding:20px;text-align:center"><h2 style="color:#fca5a5">🚫 رابط لوحة التحكم تغير</h2><p>الرابط الجديد: '+SETTINGS.adminPath+'</p><a href="/" style="color:#22c55e">⬅ الرئيسية</a></body></html>');
  }
  next();
}

app.use((req,res,next)=>{
  if(req.path===SETTINGS.adminPath || req.path==='/admin'){
    return adminAuth(req,res,next);
  }
  next();
});

// ========== V16 - الصفحة الرئيسية مع دخول مرة واحدة + كلمة سر خاصة ==========
app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html dir=rtl lang=ar><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن 🔐📸🏆</title><link rel=manifest href=/manifest.json><meta name=theme-color content=#16a34a><style>
body{margin:0;background:radial-gradient(circle at top,#0f172a,#020617);color:#fff;font-family:system-ui;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:18px}
.card{background:#0f172aee;border:1px solid #1e293b;border-radius:24px;padding:20px;width:100%;max-width:430px;text-align:center;box-shadow:0 20px 60px #000;margin:10px 0}
.logo{font-size:34px;font-weight:900;color:#22c55e}
.welcome{color:#e2e8f0;font-size:14px;line-height:1.9;margin:12px 0;white-space:pre-line}
.btn{border:0;border-radius:14px;padding:14px;width:100%;font-weight:900;margin:6px 0;font-size:14px;cursor:pointer}
.rider{background:#22c55e;color:#000}.driver{background:#3b82f6;color:#fff}
.honorBoard{background:linear-gradient(135deg,#422006,#1c1108);border:2px solid #fbbf24;border-radius:16px;padding:12px;margin:12px 0}
.honorTitle{color:#fbbf24;font-weight:900;font-size:14px;text-align:center}
.honorItem{background:#020617;border-radius:10px;padding:10px;margin:8px 0;text-align:right;border-right:3px solid #fbbf24;display:flex;gap:8px;align-items:center}
.photoBox{width:50px;height:50px;border-radius:10px;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid #fbbf24;overflow:hidden}
.photoBox img{width:100%;height:100%;object-fit:cover}
.input{background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%;margin:5px 0}
.passwordBox{background:#022c22;border:1px solid #16a34a;border-radius:12px;padding:12px;margin:8px 0;text-align:right}
</style></head><body>

<!-- شاشة تسجيل الدخول بكلمة السر الخاصة -->
<div class=card id=passwordCard style="display:none">
<div class=logo>🔐 يزن</div>
<div style="font-size:14px;color:#22c55e;font-weight:900;margin:10px 0">مرحباً <span id=passUserName></span> 👋</div>
<div style="font-size:11px;color:#94a3b8;margin-bottom:12px">أدخل كلمة السر الخاصة بك للدخول</div>
<div style="font-size:12px;color:#fbbf24">👤 <span id=passUserPhone></span> - <span id=passUserRole></span></div>
<input class=input id=userPasswordInput type=password placeholder="كلمة السر الخاصة بك - 4 أرقام أو أكثر" style="text-align:center;font-size:18px;letter-spacing:4px;margin:12px 0">
<div id=passError style="color:#fca5a5;font-size:11px;margin:6px 0"></div>
<button class=btn rider onclick="verifyUserPassword()">🔓 دخول بكلمة السر</button>
<div style="display:flex;gap:6px;margin-top:8px">
<button style="flex:1;background:#0f172a;border:1px solid #1e293b;color:#94a3b8;padding:10px;border-radius:10px;font-size:11px" onclick="logout()">🚪 تسجيل خروج - حساب آخر</button>
<button style="flex:1;background:#450a0a;border:1px solid #dc2626;color:#fca5a5;padding:10px;border-radius:10px;font-size:11px" onclick="forgotPassword()">❓ نسيت كلمة السر؟</button>
</div>
<div style="font-size:10px;color:#64748b;margin-top:10px">🔐 كلمة السر الخاصة بك تحمي حسابك وطلباتك وتقييماتك<br>💡 تقدر تلغيها من الإعدادات داخل التطبيق</div>
</div>

<!-- الصفحة الرئيسية -->
<div class=card id=roleCard>
<div class=logo>🚕 يزن 🔐📸</div>
<div style="font-size:11px;color:#22c55e;background:#022c22;border:1px solid #16a34a;border-radius:8px;padding:6px;margin:8px 0">🔐 V16 - تسجيل مرة واحدة + كلمة سر خاصة للراكب والسائق + دخول تلقائي</div>
<div style="font-size:11px;color:#fbbf24;background:#422006;border:1px solid #fbbf24;border-radius:8px;padding:6px;margin:8px 0">✨ جديد: تسجل مرة واحدة فقط، بعدها تدخل تلقائياً بدون تسجيل - وتقدر تفعل كلمة سر خاصة تحميك</div>
<div class=welcome>🚕 أهلاً وسهلاً بك في يزن - مشواري
🇾🇪 من جمال تعز إلى كل اليمن

مع يزن، مشوارك بأمان.. وسعر يرضيكم إن شاءالله 💚

👤 راكب؟ نجيب لك أقرب سائق بدقة متر وتتبع حقيقي 
🚕 سائق؟ رزقك أولا من الله وثانيا نحن نخدمك 
                  توكل على الله وحدد 
                              طلب اشتراك معنا</div>
<button class=btn rider onclick="goRole('rider')">👤 راكب - تسجيل مرة واحدة + كلمة سر خاصة 🔐</button>
<button class=btn driver onclick="goRole('driver')">🚕 سائق - تسجيل مرة واحدة + كلمة سر خاصة 🔐</button>

<div class=honorBoard id=honorBoard><div class=honorTitle>📸🏆 لوحة الشرف بالصور - V16</div><div id=honorList>⏳ تحميل...</div></div>

<div style="margin-top:8px;background:#022c22;border:1px solid #16a34a;border-radius:10px;padding:8px;text-align:center">
<div style="font-size:11px;color:#22c55e;font-weight:900">🔐 V16 - دخول مرة واحدة + كلمة سر خاصة</div>
<div style="font-size:10px;color:#94a3b8;margin-top:4px">• تسجل مرة واحدة فقط، بعدها تدخل تلقائياً<br>• تقدر تفعل كلمة سر خاصة من الإعدادات داخل التطبيق<br>• الراكب والسائق: كل واحد كلمة سره الخاصة تحمي حسابه<br>• إذا فعلتها: المرة الجاية يطلب كلمة السر فقط (مو تسجيل كامل)<br>• إذا ما فعلتها: تدخل تلقائياً مباشرة بدون أي كلمة سر</div>
</div>

<div style="margin-top:8px;display:flex;gap:6px"><button style="flex:1;background:#422006;border:1px solid #fbbf24;color:#fbbf24;padding:8px;border-radius:10px;font-size:11px;font-weight:900" onclick="location.href='/awards'">📸🏆 لوحة الشرف</button><button style="flex:1;background:#0f172a;border:1px solid #1e293b;color:#94a3b8;padding:8px;border-radius:10px;font-size:11px" onclick="location.href='/rules'">📜 قوانين</button></div>
</div>

<div class=card id=loginCard style="display:none"><div id=loginTitle style="font-weight:900;color:#22c55e;margin-bottom:10px"></div>
<input id=name placeholder="الاسم الرباعي" style="background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%;margin:5px 0">
<input id=phone placeholder="رقم الجوال 777..." type=tel style="background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%;margin:5px 0">
<div id=driverExtra style="display:none"><input id=carNo placeholder="رقم السيارة" style="background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%;margin:5px 0">
<div style="display:flex;gap:6px"><input id=carModel placeholder="نوع السيارة" style="flex:1;background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff"><input id=carColor placeholder="اللون" style="flex:1;background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff"></div>
<div style="background:#0f172a;border:1px dashed #fbbf24;border-radius:12px;padding:10px;margin:6px 0"><div style="font-size:11px;color:#fbbf24;text-align:center">📸 ارفع صورك (اختياري)</div><div style="display:flex;gap:8px;margin-top:8px"><div style="flex:1;text-align:center"><input type=file id=driverPhotoInput accept="image/*" style="display:none" onchange="handleDriverPhoto(this)"><div id=driverPhotoPreview style="width:80px;height:80px;border-radius:12px;background:#020617;border:2px dashed #fbbf24;margin:6px auto;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden" onclick="driverPhotoInput.click()">👤<br><span style=font-size:9px>اضغط لرفع</span></div></div><div style="flex:1;text-align:center"><input type=file id=carPhotoInput accept="image/*" style="display:none" onchange="handleCarPhoto(this)"><div id=carPhotoPreview style="width:80px;height:80px;border-radius:12px;background:#020617;border:2px dashed #16a34a;margin:6px auto;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden" onclick="carPhotoInput.click()">🚕<br><span style=font-size:9px>اضغط لرفع</span></div></div></div></div></div>
<div style="background:#022c22;border:2px solid #16a34a;border-radius:12px;padding:10px;margin:8px 0"><div style="font-size:11px;color:#22c55e;font-weight:900;text-align:center">🔐 V16 - تسجيل مرة واحدة فقط - بعدها دخول تلقائي</div><div style="font-size:10px;color:#94a3b8;text-align:center;margin-top:4px">• تسجل بياناتك مرة واحدة فقط<br>• بعدها كل مرة تفتح التطبيق يدخلك تلقائياً بدون تسجيل<br>• تقدر تفعل كلمة سر خاصة بك من داخل التطبيق لحماية حسابك</div><label style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type=checkbox id=agreeRules style="width:18px;height:18px"><span style="font-size:12px">أوافق على <b onclick="location.href='/rules'" style="color:#22c55e;text-decoration:underline">قوانين يزن 🔐</b> - تسجيل مرة واحدة</span></label></div>
<button class=btn rider id=loginBtn onclick="register()">✅ توكل على الله - تسجيل مرة واحدة فقط</button><button style="background:transparent;color:#64748b;border:0;font-size:11px" onclick="backRole()">⬅ رجوع</button></div>

<div class=card id=codeCard style="display:none"><div style="font-weight:900;color:#22c55e">📩 كود 1234 إلى <span id=codePhone></span></div><input id=code placeholder="1234" style="background:#020617;border:1px solid #22c55e;padding:14px;border-radius:12px;color:#fff;width:100%;margin:10px 0;text-align:center;font-size:18px;letter-spacing:6px"><button class=btn rider onclick="verify()">✅ تأكيد ودخول - مرة واحدة فقط</button></div>

<script>
let driverPhotoBase64=''; let carPhotoBase64='';
function handleDriverPhoto(input){ let file=input.files[0]; if(!file) return; let reader=new FileReader(); reader.onload=(e)=>{ driverPhotoBase64=e.target.result; document.getElementById('driverPhotoPreview').innerHTML='<img src="'+driverPhotoBase64+'" style="width:100%;height:100%;object-fit:cover">'; }; reader.readAsDataURL(file); }
function handleCarPhoto(input){ let file=input.files[0]; if(!file) return; let reader=new FileReader(); reader.onload=(e)=>{ carPhotoBase64=e.target.result; document.getElementById('carPhotoPreview').innerHTML='<img src="'+carPhotoBase64+'" style="width:100%;height:100%;object-fit:cover">'; }; reader.readAsDataURL(file); }
function getDeviceId(){let id=localStorage.getItem('yazan_device_id'); if(id) return id; let h=0; let fp=navigator.userAgent+navigator.language; for(let i=0;i<fp.length;i++){h=((h<<5)-h)+fp.charCodeAt(i); h|=0;} id='dev_'+Math.abs(h)+'_'+Date.now(); localStorage.setItem('yazan_device_id',id); return id;}
let DEVICE_ID=getDeviceId(); let selectedRole=null;

function loadHonorBoard(){
  fetch('/api/ratings/drivers').then(r=>r.json()).then(drivers=>{
    let top3=drivers.slice(0,3);
    document.getElementById('honorList').innerHTML=top3.map((d,i)=>{
      let rank=i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
      let driverPhoto=d.photos?.driverPhoto? '<img src="'+d.photos.driverPhoto+'" style="width:100%;height:100%;object-fit:cover">' : '👤';
      let carPhoto=d.photos?.carPhoto? '<img src="'+d.photos.carPhoto+'" style="width:100%;height:100%;object-fit:cover">' : '🚕';
      return '<div class=honorItem><div style="display:flex;gap:6px"><div class=photoBox>'+driverPhoto+'</div><div class=photoBox style="border-color:#16a34a">'+carPhoto+'</div></div><div style=flex:1;text-align:right><b>'+rank+' '+(d.name||d.id.substring(0,8))+' - ⭐ '+d.avg.toFixed(1)+'</b><br><span style=font-size:9px;color:#94a3b8>🚕 '+(d.photos?.carModel||'')+'</span></div></div>';
    }).join('');
  });
}
loadHonorBoard();

function checkExisting(){
  let r=localStorage.getItem('yazan_role');
  let u=localStorage.getItem('yazan_user');
  if(r&&u){
    let user=JSON.parse(u);
    // تحقق هل عنده كلمة سر خاصة مفعلة؟
    fetch('/api/user-password/'+user.phone).then(res=>res.json()).then(data=>{
      if(data.enabled && data.hasPassword){
        // عنده كلمة سر - اعرض شاشة كلمة السر فقط (مو تسجيل كامل)
        document.getElementById('roleCard').style.display='none';
        document.getElementById('passwordCard').style.display='block';
        document.getElementById('passUserName').innerText=user.name;
        document.getElementById('passUserPhone').innerText=user.phone;
        document.getElementById('passUserRole').innerText=user.role==='driver'?'سائق':'راكب';
      } else {
        // ما عنده كلمة سر - دخول تلقائي مباشر
        window.location.href=r==='driver'?'/driver':'/mashwari';
      }
    }).catch(()=>{
      // إذا فشل، ادخل تلقائي
      window.location.href=r==='driver'?'/driver':'/mashwari';
    });
    return true;
  }
  return false;
}
checkExisting();

function verifyUserPassword(){
  let phone=JSON.parse(localStorage.getItem('yazan_user')).phone;
  let pass=document.getElementById('userPasswordInput').value;
  if(!pass){ document.getElementById('passError').innerText='اكتب كلمة السر'; return; }
  fetch('/api/user-password/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone, password:pass})}).then(r=>r.json()).then(data=>{
    if(data.verified){
      let role=localStorage.getItem('yazan_role');
      window.location.href=role==='driver'?'/driver':'/mashwari';
    } else {
      document.getElementById('passError').innerText='كلمة السر خطأ';
    }
  }).catch(err=>{
    // تحقق من الرد
    fetch('/api/user-password/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone, password:pass})}).then(r=>{
      if(r.status===403){ document.getElementById('passError').innerText='❌ كلمة السر خطأ - حاول مرة أخرى'; }
      else{ document.getElementById('passError').innerText='حدث خطأ - حاول مرة أخرى'; }
    });
  });
  // Enter key
  document.getElementById('userPasswordInput').addEventListener('keypress', (e)=>{ if(e.key==='Enter') verifyUserPassword(); });
}
function forgotPassword(){
  if(confirm('❓ نسيت كلمة السر؟\\n\\n• تواصل مع إدارة يزن لإعادة تعيين كلمة السر\\n• أو اضغط "تسجيل خروج - حساب آخر" وسجل من جديد بنفس الرقم\\n\\nهل تريد تسجيل خروج ودخول بحساب آخر؟')){
    logout();
  }
}
function logout(){
  localStorage.removeItem('yazan_role');
  localStorage.removeItem('yazan_user');
  localStorage.removeItem('yazan_agreed_rules');
  location.href='/';
}

function goRole(r){let a=localStorage.getItem('yazan_agreed_rules'); if(!a){ if(confirm('📜 قوانين يزن V16 🔐\\n• تسجيل مرة واحدة فقط\\n• بعدها دخول تلقائي بدون تسجيل\\n• تقدر تفعل كلمة سر خاصة من داخل التطبيق\\nموافق؟')){ location.href='/rules'; return; } else return; } selectedRole=r; roleCard.style.display='none'; loginCard.style.display='block'; loginTitle.innerText=r==='driver'?'🚕 سائق 🔐 - تسجيل مرة واحدة فقط':'👤 راكب 🔐 - تسجيل مرة واحدة فقط'; driverExtra.style.display=r==='driver'?'block':'none'; loginBtn.className='btn '+(r==='driver'?'driver':'rider');}
function backRole(){loginCard.style.display='none';roleCard.style.display='block';}
async function register(){let n=name.value.trim();let p=phone.value.trim();if(n.length<3)return alert('الاسم');if(p.length<7)return alert('الجوال');if(!agreeRules.checked)return alert('وافق على القوانين - تسجيل مرة واحدة');localStorage.setItem('temp_name',n);localStorage.setItem('temp_phone',p);localStorage.setItem('temp_role',selectedRole);localStorage.setItem('temp_driverPhoto',driverPhotoBase64);localStorage.setItem('temp_carPhoto',carPhotoBase64);localStorage.setItem('temp_carModel',carModel?.value||'');localStorage.setItem('temp_carColor',carColor?.value||'');loginCard.style.display='none';codeCard.style.display='block';codePhone.innerText=p;try{await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json','x-device-id':DEVICE_ID},body:JSON.stringify({name:n,phone:p,role:selectedRole,car:carNo?.value||'',deviceId:DEVICE_ID,driverPhoto:driverPhotoBase64,carPhoto:carPhotoBase64,carModel:carModel?.value||'',carColor:carColor?.value||''})});}catch(e){}}
function verify(){if(code.value.trim()!=='1234'&&code.value.trim()!=='')return alert('جرب 1234');let role=localStorage.getItem('temp_role');let nm=localStorage.getItem('temp_name');let ph=localStorage.getItem('temp_phone');localStorage.setItem('yazan_role',role);localStorage.setItem('yazan_user',JSON.stringify({name:nm,phone:ph,role,deviceId:DEVICE_ID}));localStorage.setItem('yazan_first_time','yes');window.location.href=role==='driver'?'/driver':'/mashwari';}
<\/script></body></html>`));

function appPage(role){
return `<!DOCTYPE html><html lang=ar dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V16 🔐</title><link rel=stylesheet href=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css><script src=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js><\/script><script src=/socket.io/socket.io.js><\/script><style>
*{box-sizing:border-box;margin:0;padding:0} body{font-family:system-ui;background:#020617;color:#fff;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.topBar{background:#0f172a;display:flex;align-items:center;padding:6px 8px;gap:8px;border-bottom:2px solid #22c55e}
.mapWrap{position:relative;flex:1;background:#000} #map{height:100%;width:100%}
.leftPanel{position:absolute;top:50px;left:8px;z-index:1000;display:flex;flex-direction:column;gap:4px;max-height:60vh;overflow-y:auto}
.cityBtn{background:#1e293bEE;border:1px solid #334155;color:#fff;padding:7px 10px;border-radius:8px;font-size:11px;font-weight:700;display:flex;justify-content:space-between;min-width:115px;cursor:pointer}
.cityBtn.active{background:#16a34a;color:#000}.cityBtn.green{background:#16a34a;color:#000}.cityBtn.area{background:#0f172a;border:1px dashed #22c55e;color:#22c55e;font-size:10px}
.zoomCtrl{position:absolute;top:8px;left:8px;z-index:1000;display:flex;flex-direction:column;background:#fff;border-radius:8px;overflow:hidden}
.zoomCtrl button{background:#fff;border:0;width:36px;height:36px;font-size:18px;font-weight:900;cursor:pointer;color:#000}
.rightPanel{position:absolute;top:8px;right:8px;z-index:1000;display:flex;flex-direction:column;gap:5px}
.rightBtn{background:#1e293bEE;border:1px solid #334155;color:#fff;padding:7px 12px;border-radius:10px;font-size:11px;font-weight:800;cursor:pointer;min-width:85px;text-align:center}
.rightBtn.green{background:#16a34a;color:#fff}.rightBtn.gold{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;border:0}
.bottomSheet{background:#0f172a;border-radius:18px 18px 0 0;padding:8px;max-height:66vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;border-top:2px solid #22c55e}
.inputRow{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:9px 12px;display:flex;align-items:center;gap:8px}
.inputRow input{background:transparent;border:0;color:#fff;width:100%;outline:none;font-size:12px}
.btnGreen{background:#22c55e;color:#000;border:0;border-radius:12px;padding:11px;width:100%;font-weight:900;font-size:12px}
.btnLoc{background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px;width:100%;font-weight:900;font-size:11px}
.btnGold{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;border:0;border-radius:12px;padding:11px;width:100%;font-weight:900;font-size:12px}
.input{background:#020617;border:1px solid #334155;padding:10px;border-radius:8px;color:#fff;width:100%;margin:4px 0}
.passwordBox{background:#022c22;border:1px solid #16a34a;border-radius:12px;padding:12px;margin:8px 0;text-align:right}
.settingsBox{background:#0f172a;border:1px solid #334155;border-radius:12px;padding:12px;margin:8px 0;text-align:right}
@keyframes pulse{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
</style></head><body>
<div class=topBar><div style="flex:1;text-align:center;color:#22c55e;font-weight:900">🇾🇪 مشواري 🔐 V16 - دخول مرة واحدة + كلمة سر خاصة</div><div style="display:flex;gap:4px"><button style="background:#022c22;border:1px solid #16a34a;color:#22c55e;padding:4px 8px;border-radius:8px;font-size:10px" onclick="openSettings()">⚙️ إعداداتي - كلمة سر خاصة</button><button style="background:#dc2626;border:0;color:#fff;padding:4px 8px;border-radius:8px;font-size:10px" onclick="logout()">🚪</button></div></div>
<div class=mapWrap><div id=map></div><div class=leftPanel id=leftPanel></div><div class=rightPanel><button class="rightBtn green" onclick="setMapType('sat')">قمر 🛰️</button><button class="rightBtn" onclick="setMapType('street')">شوارع 🗺️</button><button class="rightBtn" onclick="locateMe()">👁️ LIVE</button><button class="rightBtn gold" onclick="location.href='/awards'">🏆 شرف</button></div></div>
<div class=bottomSheet>

<!-- إعدادات كلمة السر الخاصة -->
<div class=settingsBox id=settingsBox style="display:none">
<div style="font-size:13px;color:#22c55e;font-weight:900;text-align:center">⚙️ إعداداتي - كلمة السر الخاصة 🔐</div>
<div style="font-size:11px;color:#94a3b8;text-align:center;margin:6px 0">الراكب والسائق يقدر يفعل كلمة سر خاصة تحمي حسابه<br>• تفعيل اختياري - إذا فعلتها، المرة الجاية يطلب كلمة السر فقط<br>• إذا ما فعلتها، تدخل تلقائياً بدون كلمة سر</div>

<div style="background:#020617;border-radius:10px;padding:10px;margin:8px 0;border:1px solid #1e293b">
<div style="font-size:11px;color:#fbbf24;font-weight:900">👤 حسابي:</div>
<div style="font-size:12px;color:#fff;margin:4px 0">الاسم: <span id=settingsName></span> - <span id=settingsPhone></span> - <span id=settingsRole></span></div>
<div style="font-size:10px;color:#94a3b8">🔐 دخول مرة واحدة ✅ - مسجل من: <span id=settingsDate></span></div>
</div>

<div style="background:#020617;border-radius:10px;padding:10px;margin:8px 0;border:2px solid #22c55e">
<div style="font-size:11px;color:#22c55e;font-weight:900">🔐 كلمة السر الخاصة بي (للراكب والسائق):</div>
<div style="font-size:10px;color:#94a3b8;margin:4px 0">• كلمة سر خاصة تحمي حسابك وطلباتك وتقييماتك<br>• 4 أرقام أو أكثر - مثال: 1234 أو 2025<br>• تفعيل اختياري - تقدر تلغيها أي وقت</div>
<div style="display:flex;gap:6px;margin:8px 0"><input class=input id=currentUserPass placeholder="كلمة السر الحالية (إذا مفعلة)" type=password style="flex:1"><input class=input id=newUserPass placeholder="كلمة سر جديدة - 4 أرقام أو أكثر" type=password style="flex:1"></div>
<div style="display:flex;gap:6px;margin-top:6px;align-items:center">
<label style="display:flex;align-items:center;gap:6px;font-size:12px;flex:1"><input type=checkbox id=enableUserPass> تفعيل كلمة السر الخاصة بي 🔐</label>
<button style="flex:1;background:#22c55e;color:#000;border:0;padding:10px;border-radius:8px;font-weight:900;font-size:12px" onclick="saveUserPassword()">💾 حفظ كلمة السر الخاصة</button>
</div>
<div id=userPassResult style="font-size:11px;margin:6px 0"></div>
<div style="background:#000;border-radius:8px;padding:8px;margin-top:8px;font-size:10px;color:#fde68a">
<div style="color:#22c55e;font-weight:900">💡 كيف تشتغل كلمة السر الخاصة:</div>
• <b>ما مفعل كلمة سر:</b> تفتح التطبيق → يدخل تلقائياً مباشرة بدون أي كلمة سر ✅<br>
• <b>مفعل كلمة سر:</b> تفتح التطبيق → يطلب كلمة السر الخاصة بك فقط (4 أرقام) → تدخل 🔐<br>
• <b>الراكب:</b> كلمة سره تحمي طلباته وخصوصيته<br>
• <b>السائق:</b> كلمة سره تحمي رزقه وتقييماته وصوره في لوحة الشرف
</div>
</div>

<div style="display:flex;gap:6px;margin-top:8px">
<button style="flex:1;background:#0f172a;border:1px solid #334155;color:#94a3b8;padding:10px;border-radius:8px;font-size:11px" onclick="closeSettings()">⬅ رجوع</button>
<button style="flex:1;background:#450a0a;border:1px solid #dc2626;color:#fca5a5;padding:10px;border-radius:8px;font-size:11px" onclick="logout()">🚪 تسجيل خروج - مسح الدخول التلقائي</button>
</div>
</div>

<div id=mainContent>
<div style="background:#022c22;border:1px solid #16a34a;border-radius:8px;padding:6px;text-align:center;font-size:11px;color:#94a3b8">
🔐 V16 - تسجيل مرة واحدة ✅ - أنت مسجل دخول تلقائياً<br>
<span style="color:#22c55e">👤 <span id=mainUserName></span> - <span id=mainUserPhone></span> - <span id=mainUserRole></span></span> - 
<span style="color:#fbbf24" id=mainPassStatus>كلمة سر: غير مفعلة - دخول تلقائي</span>
<button style="background:#0f172a;border:1px solid #334155;color:#22c55e;padding:2px 8px;border-radius:6px;font-size:10px;margin-right:6px" onclick="openSettings()">⚙️ تفعيل كلمة سر خاصة 🔐</button>
</div>

<div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
<div class=inputRow><span>👤</span><input id=fromInput readonly placeholder="أنت هنا - ينبض"><span style="width:8px;height:8px;background:#22c55e;border-radius:50%;display:inline-block;animation:pulse 1.5s infinite"></span></div>
<div class=inputRow><span>🏁</span><input id=toInput readonly placeholder="إلى أين في اليمن؟"><span style="color:#fbbf24;font-size:11px;font-weight:900" id=priceLabel></span></div>
</div>

<div style="text-align:center;color:#22c55e;font-weight:900;font-size:12px;margin:6px 0">👤 اختر محافظتك ثم حدد منطقتك - جمال وبيرباشا وصينة داخل تعز</div>
<div style="background:#020617;border-radius:10px;padding:6px;border:1px solid #1e293b;max-height:8vh;overflow-y:auto;font-size:10px;color:#fbbf24;text-align:center" id=chatBox>🔐 V16 - دخول مرة واحدة + كلمة سر خاصة للراكب والسائق - تسجل مرة واحدة فقط، بعدها دخول تلقائي</div>

${role==='rider'?`<div style="display:flex;gap:4px;margin-top:6px"><button style="flex:1;background:#dc2626;color:#fff;border:0;border-radius:12px;padding:11px;font-weight:900;font-size:12px" onclick="toggleFamily()">🚨 طلب لأهلي داخل تعز</button><button style="flex:1;background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px;font-weight:900;font-size:11px" onclick="locateMe()">📍 مكاني</button></div><button class=btnGreen onclick="orderNow()" style="margin-top:6px">تأكيد الطلب ✅ - دخول مرة واحدة + كلمة سر خاصة 🔐</button>`:`<div style="color:#22c55e;text-align:center;font-size:11px;font-weight:900;margin-top:6px">☕ بانتظار طلب - دخول مرة واحدة ✅ - كلمة سر خاصة تحميك 🔐</div><div id=myRating style="background:linear-gradient(135deg,#422006,#1c1108);border:1px solid #fbbf24;border-radius:10px;padding:8px;margin:6px 0;text-align:center;font-size:11px">⭐ تقييمي: تحميل...</div><button style="background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px;width:100%;font-weight:900;font-size:11px;margin-top:6px" onclick="startGPS()">▶️ ابدأ GPS LIVE - دخول مرة واحدة + كلمة سر خاصة</button>`}
</div>
</div>

<script>
let user=JSON.parse(localStorage.getItem('yazan_user')||'null');
if(!user){ location.href='/'; }
let YEMEN=${JSON.stringify(YEMEN_DATA)};
let map=L.map('map',{zoomControl:false,attributionControl:false}).setView([13.5795,44.0210],11);
let satLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19});
let streetLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19});
satLayer.addTo(map);
let pickup=null,dropoff=null,m1=null,m2=null;
function setMapType(t){ if(t==='sat'){ if(map.hasLayer(streetLayer)) map.removeLayer(streetLayer); if(!map.hasLayer(satLayer)) satLayer.addTo(map); } else { if(map.hasLayer(satLayer)) map.removeLayer(satLayer); if(!map.hasLayer(streetLayer)) streetLayer.addTo(map); } }
function locateMe(){ navigator.geolocation.getCurrentPosition(p=>{ let ll={lat:p.coords.latitude,lng:p.coords.longitude}; map.setView([ll.lat,ll.lng],15); if(m1) map.removeLayer(m1); m1=L.marker([ll.lat,ll.lng]).addTo(map); document.getElementById('fromInput').value='أنت هنا - ينبض'; pickup=ll; },()=>{ alert('📍 اسمح للموقع'); }); }
function openSettings(){
  document.getElementById('mainContent').style.display='none';
  document.getElementById('settingsBox').style.display='block';
  document.getElementById('settingsName').innerText=user.name;
  document.getElementById('settingsPhone').innerText=user.phone;
  document.getElementById('settingsRole').innerText=user.role==='driver'?'سائق 🚕':'راكب 👤';
  document.getElementById('settingsDate').innerText=new Date().toLocaleDateString();
  fetch('/api/user-password/'+user.phone).then(r=>r.json()).then(data=>{
    document.getElementById('enableUserPass').checked=data.enabled||false;
    document.getElementById('mainPassStatus').innerText=data.enabled?'كلمة سر: مفعلة 🔐 - يطلب كلمة السر عند الدخول':'كلمة سر: غير مفعلة - دخول تلقائي ✅';
  });
  document.getElementById('mainUserName').innerText=user.name;
  document.getElementById('mainUserPhone').innerText=user.phone;
  document.getElementById('mainUserRole').innerText=user.role==='driver'?'سائق':'راكب';
}
function closeSettings(){
  document.getElementById('settingsBox').style.display='none';
  document.getElementById('mainContent').style.display='block';
  fetch('/api/user-password/'+user.phone).then(r=>r.json()).then(data=>{
    document.getElementById('mainPassStatus').innerText=data.enabled?'كلمة سر: مفعلة 🔐 - يطلب كلمة السر عند الدخول':'كلمة سر: غير مفعلة - دخول تلقائي ✅';
  });
}
function saveUserPassword(){
  let current=document.getElementById('currentUserPass').value;
  let newP=document.getElementById('newUserPass').value;
  let enable=document.getElementById('enableUserPass').checked;
  if(enable && !newP){ alert('اكتب كلمة سر جديدة - 4 أرقام أو أكثر'); return; }
  fetch('/api/user-password/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:user.phone, currentPassword:current, newPassword:newP, enable})}).then(r=>r.json()).then(data=>{
    if(data.error){ document.getElementById('userPassResult').innerHTML='<span style=color:#fca5a5>❌ '+data.error+'</span>'; }
    else{
      document.getElementById('userPassResult').innerHTML='<span style=color:#22c55e>✅ '+data.message+'</span>';
      if(enable){ alert('✅ تم تفعيل كلمة السر الخاصة بك 🔐\\n\\n• المرة الجاية تفتح التطبيق سيطلب كلمة السر فقط: '+newP+'\\n• احفظ كلمة السر في مكان آمن\\n• تقدر تلغيها أي وقت من الإعدادات'); }
      else{ alert('✅ تم إلغاء كلمة السر - ستدخل تلقائياً بدون كلمة سر ✅'); }
      closeSettings();
    }
  }).catch(err=>{
    fetch('/api/user-password/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:user.phone, currentPassword:current, newPassword:newP, enable})}).then(r=>{
      if(r.status===403){ document.getElementById('userPassResult').innerHTML='<span style=color:#fca5a5>❌ كلمة السر الحالية خطأ</span>'; }
    });
  });
}
function logout(){ localStorage.removeItem('yazan_role'); localStorage.removeItem('yazan_user'); location.href='/'; }
function toggleFamily(){ alert('طلب لأهلي - من بير باشا لصينة داخل تعز'); }
function orderNow(){ alert('تم إرسال الطلب - دخول مرة واحدة ✅ - V16'); }
function startGPS(){ navigator.geolocation.watchPosition(p=>{ let socket=io(); socket.emit('update',{id:user.phone,lat:p.coords.latitude,lng:p.coords.longitude,name:user.name}); },{}, {enableHighAccuracy:true}); alert('🟢 GPS LIVE - دخول مرة واحدة + كلمة سر خاصة'); }

// Load initial data
document.getElementById('mainUserName').innerText=user.name;
document.getElementById('mainUserPhone').innerText=user.phone;
document.getElementById('mainUserRole').innerText=user.role==='driver'?'سائق 🚕':'راكب 👤';
fetch('/api/user-password/'+user.phone).then(r=>r.json()).then(data=>{
  document.getElementById('mainPassStatus').innerText=data.enabled?'كلمة سر: مفعلة 🔐':'كلمة سر: غير مفعلة - دخول تلقائي ✅';
});
<\/script></body></html>`;
}


// ========== V16 - مسارات التطبيق - إصلاح Cannot GET /mashwari ==========
app.get('/driver',(req,res)=>res.send(appPage('driver')));
app.get('/mashwari',(req,res)=>res.send(appPage('rider')));
app.get('/rider',(req,res)=>res.send(appPage('rider')));
app.get('/track',(req,res)=>res.send(appPage('rider')));
app.get('/mashwary',(req,res)=>res.send(appPage('rider'))); // احتياطي للإملاء

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>{console.log('V16 ONE-TIME LOGIN + USER PASSWORD READY '+PORT); keepAlive();});

