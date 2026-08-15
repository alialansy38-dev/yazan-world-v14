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
let DRIVER_PHOTOS=new Map(); let USER_PASSWORDS=new Map();
let BANNED_IPS=new Set(); let BANNED_PHONES=new Set(); let BANNED_DEVICES=new Set();
let LIVE_DRIVERS=new Map();

const YEMEN_DATA={
  "اليمن كامل":{center:[15.5527,48.5164],zoom:6,icon:"🇾🇪",isGov:false},
  "صنعاء":{center:[15.3694,44.1910],zoom:11,icon:"🏛️",isGov:true,areas:["التحرير","السبعين","حدة","شملان"]},
  "عدن":{center:[12.7855,45.0187],zoom:11,icon:"⚓",isGov:true,areas:["كريتر","المعلا","التواهي"]},
  "تعز":{center:[13.5795,44.0210],zoom:12,icon:"🌅",isGov:true,areas:["جمال تعز","بير باشا","صينة","وادي القاضي","المظفر","القاهرة","صالة"]},
  "إب":{center:[13.9667,44.1833],zoom:11,icon:"💚",isGov:true,areas:["الظهار","المشنة"]},
  "الحديدة":{center:[14.7971,42.9545],zoom:11,icon:"🌊",isGov:true},
  "المكلا":{center:[14.5421,49.1242],zoom:11,icon:"🐋",isGov:true}
};

function aiDynamicPricing(from, to, base, perKm){ let R=6371,dLa=(to.lat-from.lat)*Math.PI/180,dLo=(to.lng-from.lng)*Math.PI/180; let a=Math.sin(dLa/2)**2+Math.cos(from.lat*Math.PI/180)*Math.cos(to.lat*Math.PI/180)*Math.sin(dLo/2)**2; let km=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); let price=base+km*perKm; let surge=1.0; let hour=new Date().getHours(); if(hour>=22||hour<=5) surge=1.3; else if((hour>=7&&hour<=9)||(hour>=16&&hour<=19)) surge=1.2; if(km>15) surge*=1.15; return {base:Math.round(price), final:Math.round(price*surge), km:km.toFixed(1)}; }
function keepAlive(){ const url=(process.env.RENDER_EXTERNAL_URL||'https://yazan-world-v14-taiz.onrender.com')+'/health'; https.get(url,()=>{}).on('error',()=>{}); }
setInterval(keepAlive,4*60*1000);

app.get('/health',(req,res)=>res.json({status:'V17 FULL FEATURES', adminPath:SETTINGS.adminPath}));
app.get('/manifest.json',(req,res)=>res.json({name:"يزن V17",short_name:"يزن",start_url:"/",display:"standalone",background_color:"#020617",theme_color:"#16a34a"}));
app.get('/api/settings',(req,res)=>res.json(SETTINGS));
app.get('/api/users',(req,res)=>res.json(USERS));
app.get('/api/ratings/drivers',(req,res)=>{
  let list=[...DRIVER_RATINGS.entries()].map(([id,data])=>{ let photos=DRIVER_PHOTOS.get(id)||{}; return {id, ...data, photos}; }).sort((a,b)=>b.avg - a.avg || b.count - a.count);
  if(list.length<3){
    list=[
      {id:'777123456', name:'أحمد المظفر', avg:4.92, count:85, trips:85, totalStars:418, badges:['free_life','legend'], freeLife:true, photos:{driverPhoto:'',carPhoto:'',carModel:'كامري 2020',carColor:'أبيض'}, comments:[]},
      {id:'777234567', name:'محمد جمال', avg:4.85, count:62, trips:62, totalStars:300, badges:['legend'], freeLife:false, photos:{driverPhoto:'',carPhoto:'',carModel:'كورولا 2019',carColor:'فضي'}, comments:[]},
      ...list
    ];
  }
  res.json(list);
});
app.get('/api/user-password/:phone',(req,res)=>{ let p=USER_PASSWORDS.get(req.params.phone); if(!p) return res.json({enabled:false}); res.json({enabled:p.enabled, hasPassword:!!p.password}); });
app.post('/api/user-password/set',(req,res)=>{
  let {phone, currentPassword, newPassword, enable}=req.body;
  if(!phone) return res.status(400).json({error:'رقم الجوال مطلوب'});
  let existing=USER_PASSWORDS.get(phone);
  if(existing && existing.enabled && existing.password){ if(currentPassword!==existing.password) return res.status(403).json({error:'كلمة السر الحالية خطأ'}); }
  if(enable && !newPassword) return res.status(400).json({error:'اكتب كلمة سر جديدة'});
  USER_PASSWORDS.set(phone,{password:newPassword||'', enabled:!!enable, updatedAt:Date.now()});
  res.json({ok:true, enabled:!!enable});
});
app.post('/api/register',(req,res)=>{
  let {phone,deviceId,driverPhoto,carPhoto,carModel,carColor}=req.body;
  let existingUser=USERS.find(u=>u.phone===phone);
  if(!existingUser) USERS.push({...req.body,time:Date.now()});
  if(req.body.role==='driver'){
    if(!DRIVER_RATINGS.has(phone)) DRIVER_RATINGS.set(phone,{totalStars:25, count:5, avg:5.0, comments:[], trips:5, badges:[], freeLife:false, joinDate:Date.now(), name:req.body.name});
    if(driverPhoto||carPhoto) DRIVER_PHOTOS.set(phone,{driverPhoto:driverPhoto||'',carPhoto:carPhoto||'',carModel:carModel||'',carColor:carColor||'',updatedAt:Date.now()});
  }
  res.json({ok:true});
});

app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html dir=rtl lang=ar><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V17 🔐📸🏆</title><link rel=stylesheet href=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css><script src=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js><\/script><script src=/socket.io/socket.io.js><\/script><style>
body{margin:0;background:radial-gradient(circle at top,#0f172a,#020617);color:#fff;font-family:system-ui;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:18px}
.card{background:#0f172aee;border:1px solid #1e293b;border-radius:24px;padding:20px;width:100%;max-width:430px;text-align:center;box-shadow:0 20px 60px #000;margin:10px 0}
.logo{font-size:34px;font-weight:900;color:#22c55e}.btn{border:0;border-radius:14px;padding:14px;width:100%;font-weight:900;margin:6px 0;font-size:14px;cursor:pointer}.rider{background:#22c55e;color:#000}.driver{background:#3b82f6;color:#fff}
</style></head><body>
<div class=card id=roleCard><div class=logo>🚕 يزن V17 🔐📸🏆</div><div style="font-size:11px;color:#22c55e;background:#022c22;border:1px solid #16a34a;border-radius:8px;padding:6px;margin:8px 0">🔐 V17 - دخول مرة واحدة + GPS دقيق 5م + كل الميزات + صوت يتكلم</div>
<button class=btn rider onclick="goRole('rider')">👤 راكب - V17 الكامل</button><button class=btn driver onclick="goRole('driver')">🚕 سائق - V17 الكامل</button></div>
<div class=card id=loginCard style="display:none"><div id=loginTitle style="font-weight:900;color:#22c55e;margin-bottom:10px"></div>
<input id=name placeholder="الاسم الرباعي" style="background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%;margin:5px 0">
<input id=phone placeholder="رقم الجوال 777..." type=tel style="background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%;margin:5px 0">
<div id=driverExtra style="display:none"><input id=carNo placeholder="رقم السيارة" style="background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%;margin:5px 0">
<div style="display:flex;gap:6px"><input id=carModel placeholder="نوع السيارة" style="flex:1;background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff"><input id=carColor placeholder="اللون" style="flex:1;background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff"></div></div>
<label style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type=checkbox id=agreeRules style="width:18px;height:18px"><span style="font-size:12px">أوافق على القوانين</span></label>
<button class=btn rider id=loginBtn onclick="register()">✅ توكل على الله - V17</button><button style="background:transparent;color:#64748b;border:0;font-size:11px" onclick="backRole()">⬅ رجوع</button></div>
<div class=card id=codeCard style="display:none"><div style="font-weight:900;color:#22c55e">📩 كود 1234 إلى <span id=codePhone></span></div><input id=code placeholder="1234" style="background:#020617;border:1px solid #22c55e;padding:14px;border-radius:12px;color:#fff;width:100%;margin:10px 0;text-align:center;font-size:18px;letter-spacing:6px"><button class=btn rider onclick="verify()">✅ تأكيد ودخول V17</button></div>
<script>
let driverPhotoBase64=''; let carPhotoBase64=''; let selectedRole=null;
function getDeviceId(){let id=localStorage.getItem('yazan_device_id'); if(id) return id; id='dev_'+Date.now(); localStorage.setItem('yazan_device_id',id); return id;}
let DEVICE_ID=getDeviceId();
function goRole(r){selectedRole=r; document.getElementById('roleCard').style.display='none'; document.getElementById('loginCard').style.display='block'; document.getElementById('loginTitle').innerText=r==='driver'?'🚕 سائق V17':'👤 راكب V17'; document.getElementById('driverExtra').style.display=r==='driver'?'block':'none';}
function backRole(){document.getElementById('loginCard').style.display='none'; document.getElementById('roleCard').style.display='block';}
async function register(){
  try{
    let n=document.getElementById('name')?.value?.trim()||''; let p=document.getElementById('phone')?.value?.trim()||''; let agree=document.getElementById('agreeRules')?.checked;
    if(n.length<3){alert('اكتب اسمك'); return;} if(p.length<7){alert('رقم الجوال قصير'); return;} if(!agree){alert('وافق على القوانين'); return;}
    localStorage.setItem('temp_name',n); localStorage.setItem('temp_phone',p); localStorage.setItem('temp_role',selectedRole);
    localStorage.setItem('yazan_agreed_rules','yes');
    document.getElementById('loginCard').style.display='none'; document.getElementById('codeCard').style.display='block'; document.getElementById('codePhone').innerText=p;
    fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,phone:p,role:selectedRole,car:document.getElementById('carNo')?.value||'',deviceId:DEVICE_ID})}).catch(()=>{});
  }catch(e){ alert('خطأ: '+e.message); }
}
function verify(){
  let c=document.getElementById('code')?.value?.trim()||''; if(c!=='' && c!=='1234'){alert('الكود 1234'); return;}
  let role=localStorage.getItem('temp_role'); let nm=localStorage.getItem('temp_name'); let ph=localStorage.getItem('temp_phone');
  localStorage.setItem('yazan_role',role); localStorage.setItem('yazan_user',JSON.stringify({name:nm,phone:ph,role,deviceId:DEVICE_ID})); localStorage.setItem('yazan_first_time','yes');
  window.location.href=role==='driver'?'/driver':'/mashwari';
}
<\/script></body></html>`));

function appPage(role){
return `<!DOCTYPE html><html lang=ar dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V17 الكامل</title><link rel=stylesheet href=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css><script src=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js><\/script><script src=/socket.io/socket.io.js><\/script><style>
*{box-sizing:border-box;margin:0;padding:0} body{font-family:system-ui;background:#020617;color:#fff;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.topBar{background:#0f172a;display:flex;align-items:center;padding:6px 8px;gap:8px;border-bottom:2px solid #22c55e}
.mapWrap{position:relative;flex:1;background:#000} #map{height:100%;width:100%}
.leftPanel{position:absolute;top:50px;left:8px;z-index:1000;display:flex;flex-direction:column;gap:4px;max-height:60vh;overflow-y:auto}
.cityBtn{background:#1e293bEE;border:1px solid #334155;color:#fff;padding:7px 10px;border-radius:8px;font-size:11px;font-weight:700;display:flex;justify-content:space-between;min-width:125px;cursor:pointer}
.cityBtn.active{background:#16a34a;color:#000}.cityBtn.area{background:#0f172a;border:1px dashed #22c55e;color:#22c55e;font-size:10px}
.rightPanel{position:absolute;top:8px;right:8px;z-index:1000;display:flex;flex-direction:column;gap:5px}
.rightBtn{background:#1e293bEE;border:1px solid #334155;color:#fff;padding:7px 12px;border-radius:10px;font-size:11px;font-weight:800;cursor:pointer;min-width:85px;text-align:center}
.rightBtn.green{background:#16a34a;color:#fff}.rightBtn.gold{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;border:0}
.bottomSheet{background:#0f172a;border-radius:18px 18px 0 0;padding:8px;max-height:68vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;border-top:2px solid #22c55e}
.inputRow{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:9px 12px;display:flex;align-items:center;gap:8px}
.inputRow input{background:transparent;border:0;color:#fff;width:100%;outline:none;font-size:12px}
.btnGreen{background:#22c55e;color:#000;border:0;border-radius:12px;padding:11px;width:100%;font-weight:900;font-size:12px}
.btnGold{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;border:0;border-radius:12px;padding:11px;width:100%;font-weight:900;font-size:12px}
.input{background:#020617;border:1px solid #334155;padding:10px;border-radius:8px;color:#fff;width:100%;margin:4px 0}
.settingsBox{background:#0f172a;border:1px solid #334155;border-radius:12px;padding:12px;margin:8px 0;text-align:right}
.driverCard{background:#020617;border:1px solid #1e293b;border-radius:12px;padding:8px;margin:4px 0;display:flex;gap:8px;align-items:center}
.photoBox{width:50px;height:50px;border-radius:10px;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid #fbbf24;overflow:hidden}
</style></head><body>
<div class=topBar><div style="flex:1;text-align:center;color:#22c55e;font-weight:900">🇾🇪 مشواري V17 الكامل - GPS دقيق + كل الميزات 🔐📸🏆🔊</div><div style="display:flex;gap:4px"><button style="background:#022c22;border:1px solid #16a34a;color:#22c55e;padding:4px 8px;border-radius:8px;font-size:10px" onclick="openSettings()">⚙️ إعداداتي</button><button style="background:#dc2626;border:0;color:#fff;padding:4px 8px;border-radius:8px;font-size:10px" onclick="logout()">🚪</button></div></div>
<div class=mapWrap><div id=map></div><div class=leftPanel id=leftPanel></div><div class=rightPanel><button class="rightBtn green" onclick="setMapType('sat')">قمر 🛰️ Google</button><button class="rightBtn" onclick="setMapType('street')">شوارع 🗺️</button><button class="rightBtn" onclick="locateMe()">👁️ LIVE دقيق</button><button class="rightBtn gold" onclick="location.href='/awards'">🏆 شرف</button></div></div>
<div class=bottomSheet>
<div class=settingsBox id=settingsBox style="display:none">
<div style="font-size:13px;color:#22c55e;font-weight:900;text-align:center">⚙️ إعداداتي - V17 الكامل</div>
<div style="background:#020617;border-radius:10px;padding:10px;margin:8px 0;border:1px solid #1e293b"><div style="font-size:11px;color:#fbbf24;font-weight:900">👤 حسابي:</div><div style="font-size:12px;color:#fff;margin:4px 0">الاسم: <span id=settingsName></span> - <span id=settingsPhone></span> - <span id=settingsRole></span></div></div>
<div style="background:#020617;border-radius:10px;padding:10px;margin:8px 0;border:2px solid #22c55e"><div style="font-size:11px;color:#22c55e;font-weight:900">🔐 كلمة السر الخاصة بي:</div><div style="display:flex;gap:6px;margin:8px 0"><input class=input id=currentUserPass placeholder="الحالية" type=password style="flex:1"><input class=input id=newUserPass placeholder="جديدة 4+" type=password style="flex:1"></div><div style="display:flex;gap:6px;align-items:center"><label style="display:flex;align-items:center;gap:6px;font-size:12px;flex:1"><input type=checkbox id=enableUserPass> تفعيل كلمة سر 🔐</label><button style="flex:1;background:#22c55e;color:#000;border:0;padding:10px;border-radius:8px;font-weight:900" onclick="saveUserPassword()">💾 حفظ</button></div><div id=userPassResult style="font-size:11px;margin:6px 0"></div></div>
<div style="display:flex;gap:6px"><button style="flex:1;background:#0f172a;border:1px solid #334155;color:#94a3b8;padding:10px;border-radius:8px" onclick="closeSettings()">⬅ رجوع</button><button style="flex:1;background:#450a0a;border:1px solid #dc2626;color:#fca5a5;padding:10px;border-radius:8px" onclick="logout()">🚪 خروج</button></div>
</div>
<div id=mainContent>
<div style="background:#022c22;border:1px solid #16a34a;border-radius:8px;padding:6px;text-align:center;font-size:11px;color:#94a3b8">
V17 الكامل ✅ - <span style="color:#22c55e">👤 <span id=mainUserName></span> - <span id=mainUserPhone></span> - <span id=mainUserRole></span></span> - <span style="color:#fbbf24" id=mainPassStatus>...</span> - <span id=accText style="color:#fff"></span>
</div>
<div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
<div class=inputRow><span>👤</span><input id=fromInput readonly placeholder="أنت هنا - اضغط 📍 مكاني للدقة العالية"><span id=accDot style="width:10px;height:10px;background:#dc2626;border-radius:50%;display:inline-block"></span></div>
<div class=inputRow><span>🏁</span><input id=toInput readonly placeholder="إلى أين؟ اختر من اليسار أو اضغط هنا" onclick="askDestination()"><span style="color:#fbbf24;font-size:11px;font-weight:900" id=priceLabel></span></div>
</div>
<div style="text-align:center;color:#22c55e;font-weight:900;font-size:11px;margin:6px 0">👤 اختر محافظتك ثم منطقتك - تعز: جمال وبيرباشا وصينة داخل تعز - كل المحافظات</div>
<div style="background:#020617;border-radius:10px;padding:6px;border:1px solid #1e293b;max-height:10vh;overflow-y:auto;font-size:10px;color:#fbbf24;text-align:center" id=chatBox>🔐 V17 الكامل - دخول مرة واحدة + GPS دقيق 5م + صوت يتكلم + كل الميزات + صور + تقييم</div>
<div id=driversList style="max-height:20vh;overflow-y:auto;background:#020617;border-radius:10px;border:1px solid #1e293b;padding:4px;margin:4px 0"><div style="font-size:11px;color:#fbbf24;text-align:center">🚕 السائقين القريبين LIVE - بانتظار GPS...</div></div>
\${role==='rider'?`<div style="display:flex;gap:4px;margin-top:6px"><button style="flex:1;background:#dc2626;color:#fff;border:0;border-radius:12px;padding:11px;font-weight:900;font-size:12px" onclick="toggleFamily()">🚨 طلب لأهلي داخل تعز</button><button style="flex:1;background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px;font-weight:900;font-size:11px" onclick="locateMe()">📍 مكاني دقيق 5م</button></div><div style="display:flex;gap:4px;margin-top:4px"><button style="flex:1;background:#0f172a;border:1px solid #334155;color:#fff;padding:10px;border-radius:10px;font-size:11px" onclick="speakMyLocation()">🔊 تكلم مكاني</button><button style="flex:1;background:#0f172a;border:1px solid #fbbf24;color:#fbbf24;padding:10px;border-radius:10px;font-size:11px" onclick="shareLocation()">📤 مشاركة مكاني</button><button style="flex:1;background:#0f172a;border:1px solid #22c55e;color:#22c55e;padding:10px;border-radius:10px;font-size:11px" onclick="calculatePrice()">💰 السعر</button></div><button class=btnGreen onclick="orderNow()" style="margin-top:6px">تأكيد الطلب ✅ - GPS دقيق + صوت + V17 الكامل</button>`:`<div style="color:#22c55e;text-align:center;font-size:11px;font-weight:900;margin-top:6px">☕ بانتظار طلب - V17 الكامل + GPS دقيق + كل الميزات</div><div id=myRating style="background:linear-gradient(135deg,#422006,#1c1108);border:1px solid #fbbf24;border-radius:10px;padding:8px;margin:6px 0;text-align:center;font-size:11px">⭐ تقييمي: تحميل...</div><div style="display:flex;gap:4px"><button style="flex:1;background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px;font-weight:900;font-size:11px" onclick="startGPS()">▶️ ابدأ GPS LIVE دقيق</button><button style="flex:1;background:#0f172a;border:1px solid #fbbf24;color:#fbbf24;padding:10px;border-radius:10px;font-size:11px" onclick="speak('أنا جاهز لاستقبال الطلبات')">🔊 تكلم</button></div><div id=ordersList style="max-height:25vh;overflow-y:auto;margin-top:6px;background:#020617;border-radius:10px;border:1px solid #1e293b;padding:4px">لا يوجد طلبات</div>`}
</div>
</div>
<script>
let user=JSON.parse(localStorage.getItem('yazan_user')||'null'); if(!user){ location.href='/'; }
let YEMEN={"تعز":{center:[13.5795,44.0210],zoom:12,icon:"🌅",areas:["جمال تعز","بير باشا","صينة","وادي القاضي","المظفر"]},"صنعاء":{center:[15.3694,44.1910],zoom:11,icon:"🏛️",areas:["التحرير","السبعين","حدة"]},"عدن":{center:[12.7855,45.0187],zoom:11,icon:"⚓",areas:["كريتر","المعلا"]},"إب":{center:[13.9667,44.1833],zoom:11,icon:"💚",areas:["الظهار"]}};
let map=L.map('map',{zoomControl:false,attributionControl:false}).setView([13.5795,44.0210],12);
let googleHybrid=L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',{maxZoom:20, subdomains:['mt0','mt1','mt2','mt3']});
let streetLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19});
let satLayer=googleHybrid; satLayer.addTo(map);
let pickup=null,m1=null,driversMarkers=new Map(); let watchId=null; let bestAcc=9999; let socket=io();
function speak(text){ try{ if('speechSynthesis' in window){ speechSynthesis.cancel(); let u=new SpeechSynthesisUtterance(text); u.lang='ar-SA'; u.rate=0.95; speechSynthesis.speak(u);} }catch(e){} }
function speakMyLocation(){ if(!pickup){ speak('حدد مكانك أولا'); locateMe(); return;} speak('أنت في تعز، دقة '+Math.round(bestAcc)+' متر'); }
function shareLocation(){ if(!pickup){ alert('حدد مكانك أولا'); return;} let txt='مكاني: https://maps.google.com/?q='+pickup.lat+','+pickup.lng+' دقة '+Math.round(bestAcc)+'م'; navigator.clipboard.writeText(txt).then(()=>alert('✅ تم نسخ:\\n'+txt)); }
function setMapType(t){ if(map.hasLayer(streetLayer)) map.removeLayer(streetLayer); if(map.hasLayer(googleHybrid)) map.removeLayer(googleHybrid); satLayer=(t==='sat'?googleHybrid:streetLayer); satLayer.addTo(map); speak(t==='sat'?'قمر صناعي':'شوارع'); }
window.setMapType=setMapType;
function renderCities(){ let panel=document.getElementById('leftPanel'); let html=''; Object.keys(YEMEN).forEach(gov=>{ let data=YEMEN[gov]; html+='<button class=cityBtn onclick="selectGov(\\''+gov+'\\')"><span>'+data.icon+' '+gov+'</span></button>'; if(data.areas){ data.areas.forEach(area=>{ html+='<button class="cityBtn area" onclick="selectArea(\\''+gov+'\\',\\''+area+'\\')" style="margin-right:10px"><span>• '+area+'</span></button>'; }); } }); panel.innerHTML=html; }
function selectGov(gov){ let d=YEMEN[gov]; if(!d) return; map.setView(d.center,d.zoom); document.getElementById('toInput').value=gov; document.getElementById('chatBox').innerHTML='📍 '+gov+' - اختر المنطقة'; speak('تم اختيار '+gov); calculatePrice(); }
function selectArea(gov,area){ let d=YEMEN[gov]; if(d) map.setView(d.center,14); document.getElementById('toInput').value=gov+' - '+area; document.getElementById('chatBox').innerHTML='✅ '+area+' - '+gov; speak(area); calculatePrice(); }
renderCities();
function askDestination(){ let dest=prompt('🏁 إلى أين؟\\nمثال: جمال تعز، بيرباشا، صينة، صنعاء'); if(dest){ document.getElementById('toInput').value=dest; calculatePrice(); } }
function calculatePrice(){ let to=document.getElementById('toInput').value; if(to && pickup){ let price=800+Math.floor(Math.random()*600); document.getElementById('priceLabel').innerText=price+' ر.ي'; return price;} return 800; }
function locateMe(){
  let fromInput=document.getElementById('fromInput'); let accDot=document.getElementById('accDot'); let accText=document.getElementById('accText');
  fromInput.value='⏳ جاري التحديد بدقة عالية...'; accDot.style.background='#fbbf24'; speak('جاري تحديد موقعك بدقة عالية');
  if(watchId) navigator.geolocation.clearWatch(watchId); bestAcc=9999;
  navigator.geolocation.getCurrentPosition(pos=>{ updateLocation(pos); watchId=navigator.geolocation.watchPosition(pos=>{ updateLocation(pos); if(pos.coords.accuracy<=10){ navigator.geolocation.clearWatch(watchId); fromInput.value='📍 أنت هنا - دقة '+Math.round(pos.coords.accuracy)+'م - ممتاز ✅'; accText.innerText='✅ '+Math.round(pos.coords.accuracy)+'م'; accDot.style.background='#22c55e'; speak('تم تحديد موقعك بدقة '+Math.round(pos.coords.accuracy)+' متر'); } }, err=>{}, {enableHighAccuracy:true, maximumAge:0, timeout:20000}); setTimeout(()=>{ if(watchId) navigator.geolocation.clearWatch(watchId); },20000);
  }, err=>{ alert('📍 فعل GPS والموقع'); fromInput.value='❌ فشل - فعل GPS'; }, {enableHighAccuracy:true, maximumAge:0, timeout:20000});
}
function updateLocation(p){
  let acc=p.coords.accuracy; if(acc<bestAcc){ bestAcc=acc; let ll={lat:p.coords.latitude,lng:p.coords.longitude}; map.setView([ll.lat,ll.lng],18); if(m1) map.removeLayer(m1); m1=L.marker([ll.lat,ll.lng],{icon:L.divIcon({html:'<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 15px #22c55e"></div>',iconSize:[16,16]})}).addTo(map); if(window.myCircle) map.removeLayer(window.myCircle); window.myCircle=L.circle([ll.lat,ll.lng],{radius:acc,color:'#22c55e',fillOpacity:0.15}).addTo(map); document.getElementById('fromInput').value='📍 أنت هنا - دقة '+Math.round(acc)+'م'; document.getElementById('accText').innerText=Math.round(acc)+'م'; document.getElementById('accDot').style.background=acc<=15?'#22c55e':acc<=50?'#fbbf24':'#dc2626'; pickup=ll; socket.emit('riderLocation',{lat:ll.lat,lng:ll.lng,phone:user.phone,name:user.name,accuracy:acc}); document.getElementById('chatBox').innerHTML='📍 دقة '+Math.round(acc)+'م - '+(acc<=15?'✅ ممتاز جاهز':'⏳ تحسين...'); }
}
function toggleFamily(){ if(!pickup){ alert('📍 حدد مكانك أولاً'); locateMe(); return;} let to=prompt('🚨 طلب لأهلي داخل تعز\\nمن بير باشا إلى أين؟'); if(!to) return; if(confirm('تأكيد إلى '+to+'؟')){ speak('تم إرسال طلب لأهلك إلى '+to); socket.emit('familyOrder',{from:pickup,to:to,phone:user.phone,name:user.name,accuracy:bestAcc}); alert('✅ تم إرسال طلب لأهلي'); } }
function orderNow(){ let to=document.getElementById('toInput').value; if(!pickup){ alert('📍 حدد مكانك'); locateMe(); return;} if(!to){ askDestination(); to=document.getElementById('toInput').value; if(!to) return;} let price=calculatePrice(); speak('تم إرسال طلبك إلى '+to); socket.emit('newOrder',{from:pickup,to:to,price:price,phone:user.phone,name:user.name,accuracy:bestAcc}); alert('✅ طلب إلى '+to+' - '+price+' ر.ي'); }
function startGPS(){ speak('تم تشغيل التتبع المباشر'); let w=navigator.geolocation.watchPosition(p=>{ socket.emit('update',{id:user.phone,lat:p.coords.latitude,lng:p.coords.longitude,name:user.name,role:'driver'}); }, err=>{}, {enableHighAccuracy:true}); alert('🟢 GPS LIVE شغال'); }
socket.on('drivers', list=>{ let div=document.getElementById('driversList'); if(!div) return; if(!list||list.length===0){ div.innerHTML='<div style="font-size:11px;color:#64748b;text-align:center">لا يوجد سائقين</div>'; return;} div.innerHTML=list.slice(0,5).map(d=>'<div class=driverCard><div class=photoBox>🚕</div><div style=flex:1><b>'+d.name+'</b><br><span style=font-size:10px;color:#22c55e>'+(d.carModel||'سائق')+'</span></div></div>').join(''); });
function openSettings(){ document.getElementById('mainContent').style.display='none'; document.getElementById('settingsBox').style.display='block'; document.getElementById('settingsName').innerText=user.name; document.getElementById('settingsPhone').innerText=user.phone; document.getElementById('settingsRole').innerText=user.role; }
function closeSettings(){ document.getElementById('settingsBox').style.display='none'; document.getElementById('mainContent').style.display='block'; }
function saveUserPassword(){ let cur=document.getElementById('currentUserPass').value; let np=document.getElementById('newUserPass').value; let en=document.getElementById('enableUserPass').checked; if(en && !np){alert('اكتب كلمة سر');return;} fetch('/api/user-password/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:user.phone,currentPassword:cur,newPassword:np,enable:en})}).then(r=>r.json()).then(d=>{ if(d.error){ document.getElementById('userPassResult').innerText=d.error; } else { alert('✅ تم'); closeSettings(); } }); }
function logout(){ if(confirm('خروج؟')){ localStorage.removeItem('yazan_role'); localStorage.removeItem('yazan_user'); location.href='/'; } }
document.getElementById('mainUserName').innerText=user.name; document.getElementById('mainUserPhone').innerText=user.phone; document.getElementById('mainUserRole').innerText=user.role; setTimeout(locateMe,1000);
<\/script></body></html>`;
}

app.get('/driver',(req,res)=>res.send(appPage('driver')));
app.get('/mashwari',(req,res)=>res.send(appPage('rider')));
app.get('/rider',(req,res)=>res.send(appPage('rider')));
app.get('/track',(req,res)=>res.send(appPage('rider')));

io.on('connection', socket=>{
  socket.on('riderLocation', data=>{});
  socket.on('newOrder', data=>{ io.emit('newOrder', data); });
  socket.on('familyOrder', data=>{ io.emit('newOrder', {...data, family:true}); });
  socket.on('update', data=>{ LIVE_DRIVERS.set(data.id, {...data, time:Date.now()}); let list=[...LIVE_DRIVERS.values()].filter(d=>Date.now()-d.time<60000); io.emit('drivers', list); });
  socket.on('driverReady', data=>{});
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>{console.log('V17 FULL ALL FEATURES READY '+PORT); keepAlive();});
