const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const cors=require('cors');
const https=require('https');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"}});
app.use(cors());
app.use(express.json({limit:'50mb'}));
let SETTINGS={adminPath:'/admin'};
let USERS=[]; let DRIVERS=new Map(); let ORDERS=[];
let USER_PASSWORDS=new Map();
const YEMEN={
  "تعز":{center:[13.5795,44.0210],zoom:12,areas:["جمال تعز","بير باشا","صينة","وادي القاضي","المظفر"]},
  "صنعاء":{center:[15.3694,44.1910],zoom:11,areas:["التحرير","السبعين","حدة"]},
  "عدن":{center:[12.7855,45.0187],zoom:11,areas:["كريتر","المعلا"]},
  "إب":{center:[13.9667,44.1833],zoom:11,areas:["الظهار"]},
  "الحديدة":{center:[14.7971,42.9545],zoom:11,areas:[]},
  "المكلا":{center:[14.5421,49.1242],zoom:11,areas:[]}
};
function keepAlive(){const url=(process.env.RENDER_EXTERNAL_URL||'https://yazan-world-v14-taiz.onrender.com')+'/health'; https.get(url,()=>{}).on('error',()=>{});}
setInterval(keepAlive,4*60*1000);
app.get('/health',(req,res)=>res.json({status:'OK V17'}));
app.get('/api/user-password/:phone',(req,res)=>{let p=USER_PASSWORDS.get(req.params.phone); if(!p) return res.json({enabled:false}); res.json({enabled:p.enabled});});
app.post('/api/user-password/set',(req,res)=>{let {phone,newPassword,enable}=req.body; USER_PASSWORDS.set(phone,{password:newPassword||'',enabled:!!enable}); res.json({ok:true});});
app.post('/api/register',(req,res)=>{let {phone}=req.body; if(!USERS.find(u=>u.phone===phone)) USERS.push(req.body); res.json({ok:true});});
app.get('/awards',(req,res)=>res.send('<h1 style="text-align:center;color:#fbbf24">🏆 لوحة الشرف</h1><a href="/">رجوع</a>'));
app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V17</title><style>
body{margin:0;background:#020617;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
.card{background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:20px;max-width:420px;width:100%;text-align:center}
.logo{font-size:32px;color:#22c55e;font-weight:900}.btn{border:0;border-radius:12px;padding:14px;width:100%;font-weight:900;margin:6px 0}.rider{background:#22c55e;color:#000}.driver{background:#3b82f6;color:#fff}
</style></head><body>
<div class=card id=roleCard><div class=logo>🚕 يزن V17 الكامل</div><div style="font-size:11px;color:#22c55e;margin:8px 0">✅ تسجيل مرة واحدة + GPS دقيق 5م + كل الميزات + صوت</div>
<button class=btn rider onclick="goRole('rider')">👤 راكب - V17</button><button class=btn driver onclick="goRole('driver')">🚕 سائق - V17</button></div>
<div class=card id=loginCard style="display:none"><div id=loginTitle style="color:#22c55e;font-weight:900"></div>
<input id=name placeholder="الاسم الرباعي" style="background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%;margin:5px 0">
<input id=phone placeholder="777..." style="background:#020617;border:1px solid #334155;padding:12px;border-radius:10px;color:#fff;width:100%;margin:5px 0">
<div id=driverExtra style="display:none"><input id=carModel placeholder="نوع السيارة" style="background:#020617;border:1px solid #334155;padding:10px;border-radius:8px;color:#fff;width:48%"><input id=carColor placeholder="اللون" style="background:#020617;border:1px solid #334155;padding:10px;border-radius:8px;color:#fff;width:48%"></div>
<label style="display:flex;gap:6px;align-items:center;margin:8px 0"><input type=checkbox id=agreeRules><span style="font-size:12px">أوافق على القوانين</span></label>
<button class=btn rider onclick="register()">✅ توكل على الله - V17</button><button style="background:transparent;color:#888;border:0" onclick="backRole()">⬅ رجوع</button></div>
<div class=card id=codeCard style="display:none"><div>📩 كود 1234 إلى <span id=codePhone></span></div><input id=code placeholder="1234" style="background:#020617;border:1px solid #22c55e;padding:12px;border-radius:10px;color:#fff;width:100%;margin:10px 0;text-align:center"><button class=btn rider onclick="verify()">✅ تأكيد ودخول</button></div>
<script>
let selectedRole=null;
function goRole(r){selectedRole=r; roleCard.style.display='none'; loginCard.style.display='block'; loginTitle.innerText=r==='driver'?'🚕 سائق':'👤 راكب'; driverExtra.style.display=r==='driver'?'block':'none';}
function backRole(){loginCard.style.display='none'; roleCard.style.display='block';}
function register(){let n=name.value.trim(); let p=phone.value.trim(); if(n.length<3){alert('اسمك');return;} if(p.length<7){alert('رقم');return;} if(!agreeRules.checked){alert('وافق');return;} localStorage.setItem('temp_name',n); localStorage.setItem('temp_phone',p); localStorage.setItem('temp_role',selectedRole); loginCard.style.display='none'; codeCard.style.display='block'; codePhone.innerText=p; fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,phone:p,role:selectedRole})});}
function verify(){let c=code.value.trim(); if(c!==''&&c!=='1234'){alert('1234');return;} let r=localStorage.getItem('temp_role'); let nm=localStorage.getItem('temp_name'); let ph=localStorage.getItem('temp_phone'); localStorage.setItem('yazan_role',r); localStorage.setItem('yazan_user',JSON.stringify({name:nm,phone:ph,role:r})); location.href=r==='driver'?'/driver':'/mashwari';}
<\/script></body></html>`));

function appPage(role){
return `<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V17</title><link rel=stylesheet href=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css><script src=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js><\/script><script src=/socket.io/socket.io.js><\/script><style>
*{margin:0;padding:0;box-sizing:border-box} body{font-family:system-ui;background:#020617;color:#fff;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.topBar{background:#0f172a;padding:6px 8px;display:flex;justify-content:space-between;border-bottom:2px solid #22c55e}
.mapWrap{flex:1;position:relative;background:#000} #map{height:100%;width:100%}
.leftPanel{position:absolute;top:50px;left:8px;z-index:1000;display:flex;flex-direction:column;gap:4px;max-height:60vh;overflow-y:auto}
.cityBtn{background:#1e293bEE;border:1px solid #334155;color:#fff;padding:7px 10px;border-radius:8px;font-size:11px;font-weight:700;min-width:125px;cursor:pointer}
.cityBtn.area{background:#0f172a;border:1px dashed #22c55e;color:#22c55e;font-size:10px;margin-right:8px}
.rightPanel{position:absolute;top:8px;right:8px;z-index:1000;display:flex;flex-direction:column;gap:5px}
.rightBtn{background:#1e293bEE;border:1px solid #334155;color:#fff;padding:7px 12px;border-radius:10px;font-size:11px;font-weight:800;min-width:85px}
.rightBtn.green{background:#16a34a}.rightBtn.gold{background:#fbbf24;color:#000}
.bottomSheet{background:#0f172a;border-radius:16px 16px 0 0;padding:8px;max-height:68vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;border-top:2px solid #22c55e}
.inputRow{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:9px 12px;display:flex;gap:8px}
.inputRow input{background:transparent;border:0;color:#fff;width:100%;outline:none}
.btnGreen{background:#22c55e;color:#000;border:0;border-radius:12px;padding:11px;width:100%;font-weight:900}
</style></head><body>
<div class=topBar><div style="color:#22c55e;font-weight:900">🇾🇪 مشواري V17 - GPS دقيق 5م + كل الميزات 🔊📸</div><button style="background:#dc2626;border:0;color:#fff;padding:4px 8px;border-radius:8px" onclick="if(confirm('خروج؟')){localStorage.clear();location.href='/';}">🚪</button></div>
<div class=mapWrap><div id=map></div><div class=leftPanel id=leftPanel></div><div class=rightPanel><button class=rightBtn onclick="setMapType('sat')" style="background:#16a34a">قمر 🛰️</button><button class=rightBtn onclick="setMapType('street')">شوارع</button><button class=rightBtn onclick="locateMe()">LIVE دقيق</button><button class=rightBtn gold onclick="location.href='/awards'">شرف 🏆</button></div></div>
<div class=bottomSheet>
<div style="background:#022c22;border:1px solid #16a34a;border-radius:8px;padding:6px;text-align:center;font-size:11px">V17 ✅ <span id=mainUserName></span> - <span id=accText></span> - <span id=mainPassStatus></span></div>
<div class=inputRow><span>👤</span><input id=fromInput readonly placeholder="أنت هنا - اضغط مكاني"><span id=accDot style="width:10px;height:10px;background:red;border-radius:50%"></span></div>
<div class=inputRow><span>🏁</span><input id=toInput readonly placeholder="إلى أين؟ اختر من اليسار" onclick="askDest()"><span id=priceLabel style="color:#fbbf24;font-weight:900"></span></div>
<div style="font-size:10px;color:#22c55e;text-align:center">👤 اختر محافظتك ثم منطقتك - تعز: جمال، بيرباشا، صينة</div>
<div style="background:#020617;border-radius:8px;padding:6px;font-size:10px;color:#fbbf24;text-align:center" id=chatBox>V17 - GPS دقيق + صوت + كل الميزات</div>
<div id=driversList style="max-height:18vh;overflow-y:auto;background:#020617;border-radius:8px;padding:4px;font-size:11px;color:#fbbf24;text-align:center">🚕 السائقين LIVE</div>
\${role==='rider'?`<div style="display:flex;gap:4px"><button style="flex:1;background:#dc2626;color:#fff;border:0;border-radius:12px;padding:11px;font-weight:900" onclick="toggleFamily()">🚨 طلب لأهلي</button><button style="flex:1;background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px" onclick="locateMe()">📍 مكاني دقيق</button></div><div style="display:flex;gap:4px;margin-top:4px"><button style="flex:1;background:#0f172a;border:1px solid #334155;color:#fff;padding:9px;border-radius:8px;font-size:11px" onclick="speakMyLocation()">🔊 تكلم</button><button style="flex:1;background:#0f172a;border:1px solid #fbbf24;color:#fbbf24;padding:9px;border-radius:8px;font-size:11px" onclick="shareLocation()">📤 مشاركة</button></div><button class=btnGreen onclick="orderNow()" style="margin-top:6px">تأكيد الطلب ✅</button>`:`<div style="text-align:center;color:#22c55e;font-size:11px">☕ بانتظار طلب</div><div style="display:flex;gap:4px;margin-top:6px"><button style="flex:1;background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px" onclick="startGPS()">▶️ GPS LIVE دقيق</button><button style="flex:1;background:#0f172a;border:1px solid #fbbf24;color:#fbbf24;padding:10px;border-radius:8px" onclick="speak('جاهز')">🔊</button></div><div id=ordersList style="max-height:22vh;overflow-y:auto;background:#020617;border-radius:8px;padding:4px;margin-top:4px;font-size:11px">لا يوجد طلبات</div>`}
</div>
<script>
let user=JSON.parse(localStorage.getItem('yazan_user')||'null'); if(!user) location.href='/';
let YEMEN={"تعز":{center:[13.5795,44.0210],zoom:12,areas:["جمال تعز","بير باشا","صينة","وادي القاضي","المظفر"]},"صنعاء":{center:[15.3694,44.1910],zoom:11,areas:["التحرير","السبعين","حدة"]},"عدن":{center:[12.7855,45.0187],zoom:11,areas:["كريتر","المعلا"]},"إب":{center:[13.9667,44.1833],zoom:11,areas:["الظهار"]}};
let map=L.map('map',{zoomControl:false}).setView([13.5795,44.0210],12);
let googleHybrid=L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',{maxZoom:20,subdomains:['mt0','mt1','mt2','mt3']});
let street=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19});
let sat=googleHybrid; sat.addTo(map);
let pickup=null,m1=null,bestAcc=9999,watchId=null; let socket=io();
function speak(t){try{if('speechSynthesis' in window){speechSynthesis.cancel(); let u=new SpeechSynthesisUtterance(t); u.lang='ar-SA'; speechSynthesis.speak(u);}}catch(e){}}
function setMapType(t){ if(map.hasLayer(sat)) map.removeLayer(sat); if(map.hasLayer(street)) map.removeLayer(street); sat=(t==='sat'?googleHybrid:street); sat.addTo(map); }
function renderCities(){let p=document.getElementById('leftPanel'); let h=''; Object.keys(YEMEN).forEach(g=>{let d=YEMEN[g]; h+='<button class=cityBtn onclick="selectGov(\\''+g+'\\')">'+g+'</button>'; (d.areas||[]).forEach(a=>{h+='<button class="cityBtn area" onclick="selectArea(\\''+g+'\\',\\''+a+'\\')">• '+a+'</button>';});}); p.innerHTML=h;}
function selectGov(g){let d=YEMEN[g]; if(!d) return; map.setView(d.center,d.zoom); toInput.value=g; chatBox.innerHTML='📍 '+g; speak(g); calcPrice();}
function selectArea(g,a){let d=YEMEN[g]; if(d) map.setView(d.center,14); toInput.value=g+' - '+a; chatBox.innerHTML='✅ '+a+' - '+g; speak(a); calcPrice();}
renderCities();
function askDest(){let d=prompt('إلى أين؟'); if(d){toInput.value=d; calcPrice();}}
function calcPrice(){let to=toInput.value; if(to&&pickup){let pr=800+Math.floor(Math.random()*500); priceLabel.innerText=pr+' ر.ي'; return pr;} return 800;}
function locateMe(){fromInput.value='⏳ تحديد دقيق...'; accDot.style.background='#fbbf24'; speak('جاري تحديد موقعك'); if(watchId) navigator.geolocation.clearWatch(watchId); bestAcc=9999; navigator.geolocation.getCurrentPosition(p=>{updateLoc(p); watchId=navigator.geolocation.watchPosition(p=>{updateLoc(p); if(p.coords.accuracy<=12){navigator.geolocation.clearWatch(watchId); fromInput.value='📍 أنت هنا - دقة '+Math.round(p.coords.accuracy)+'م ✅'; accText.innerText='✅ '+Math.round(p.coords.accuracy)+'م'; accDot.style.background='#22c55e'; speak('تم تحديد موقعك بدقة '+Math.round(p.coords.accuracy)+' متر');}},()=>{}, {enableHighAccuracy:true,maximumAge:0,timeout:20000}); setTimeout(()=>{if(watchId) navigator.geolocation.clearWatch(watchId);},20000);},()=>{alert('فعل GPS'); fromInput.value='❌ فعل GPS';},{enableHighAccuracy:true,maximumAge:0,timeout:20000});}
function updateLoc(p){let acc=p.coords.accuracy; if(acc<bestAcc){bestAcc=acc; let ll={lat:p.coords.latitude,lng:p.coords.longitude}; map.setView([ll.lat,ll.lng],18); if(m1) map.removeLayer(m1); m1=L.marker([ll.lat,ll.lng]).addTo(map); if(window.circ) map.removeLayer(window.circ); window.circ=L.circle([ll.lat,ll.lng],{radius:acc,color:'#22c55e',fillOpacity:0.15}).addTo(map); fromInput.value='📍 أنت هنا - دقة '+Math.round(acc)+'م'; accText.innerText=Math.round(acc)+'م'; accDot.style.background=acc<=15?'#22c55e':acc<=50?'#fbbf24':'#dc2626'; pickup=ll; chatBox.innerHTML='📍 دقة '+Math.round(acc)+'م';}}
function speakMyLocation(){if(!pickup){locateMe();return;} speak('أنت في تعز دقة '+Math.round(bestAcc)+' متر');}
function shareLocation(){if(!pickup){alert('حدد مكانك');return;} let t='مكاني: https://maps.google.com/?q='+pickup.lat+','+pickup.lng; navigator.clipboard.writeText(t).then(()=>alert('✅ نسخ:\\n'+t));}
function toggleFamily(){if(!pickup){locateMe();return;} let to=prompt('طلب لأهلي إلى أين داخل تعز؟'); if(!to) return; if(confirm('تأكيد إلى '+to+'؟')){speak('تم إرسال طلب لأهلك'); socket.emit('familyOrder',{from:pickup,to:to,phone:user.phone,name:user.name}); alert('✅ تم');}}
function orderNow(){let to=toInput.value; if(!pickup){locateMe();return;} if(!to){askDest(); to=toInput.value; if(!to) return;} let pr=calcPrice(); speak('تم إرسال طلبك إلى '+to); socket.emit('newOrder',{from:pickup,to:to,price:pr,phone:user.phone,name:user.name}); alert('✅ طلب إلى '+to+' - '+pr+' ر.ي');}
function startGPS(){speak('تم تشغيل التتبع'); navigator.geolocation.watchPosition(p=>{socket.emit('update',{id:user.phone,lat:p.coords.latitude,lng:p.coords.longitude,name:user.name});},()=>{},{enableHighAccuracy:true}); alert('🟢 LIVE شغال');}
document.getElementById('mainUserName').innerText=user.name; setTimeout(locateMe,1000);
<\/script></body></html>`;
}
app.get('/driver',(req,res)=>res.send(appPage('driver')));
app.get('/mashwari',(req,res)=>res.send(appPage('rider')));
app.get('/rider',(req,res)=>res.send(appPage('rider')));
app.get('/track',(req,res)=>res.send(appPage('rider')));
io.on('connection',s=>{s.on('newOrder',d=>{io.emit('newOrder',d);}); s.on('familyOrder',d=>{io.emit('newOrder',d);}); s.on('update',d=>{DRIVERS.set(d.id,d); io.emit('drivers',[...DRIVERS.values()]);});});
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>{console.log('V17 STABLE READY '+PORT); keepAlive();});
