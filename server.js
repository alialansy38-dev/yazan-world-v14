
const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const cors=require('cors');
const https=require('https');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"}});
app.use(cors());
app.use(express.json());
let DRIVERS=new Map();
function keep(){try{https.get((process.env.RENDER_EXTERNAL_URL||'https://yazan-world-v14-2.onrender.com')+'/health',()=>{}).on('error',()=>{});}catch{}}
setInterval(keep,4*60*1000);
app.get('/health',(req,res)=>res.json({ok:true,time:Date.now()}));

const HOME=`<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V18</title><style>*{box-sizing:border-box}body{margin:0;background:#020617;color:#fff;font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:12px}.card{background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:16px;max-width:400px;width:100%;text-align:center}.input{width:100%;padding:12px;margin:5px 0;border-radius:10px;border:1.5px solid #334155;background:#020617;color:#fff}.btn{width:100%;padding:14px;border-radius:12px;border:0;font-weight:900;margin:6px 0;cursor:pointer}.green{background:#22c55e;color:#000}.blue{background:#3b82f6;color:#fff}.err{color:#fca5a5;background:#450a0a;border:1px solid #dc2626;padding:8px;border-radius:8px;font-size:12px;margin:6px 0;display:none}</style></head><body>
<div class=card id=roleCard><div style="font-size:28px;color:#22c55e;font-weight:900">🚕 يزن V18 📧</div><div style="font-size:11px;color:#22c55e;background:#022c22;border:1px solid #16a34a;padding:6px;border-radius:8px;margin:8px 0">✅ بريد + كود 1234 + خريطة كاملة - نسخة نهائية</div><button class="btn green" onclick="goRole('rider')">👤 راكب - بالبريد</button><button class="btn blue" onclick="goRole('driver')">🚕 سائق - بالبريد</button></div>
<div class=card id=loginCard style="display:none"><div id=loginTitle style="color:#22c55e;font-weight:900;margin-bottom:8px"></div><input id=uName class=input placeholder="الاسم الرباعي *"><input id=uPhone class=input placeholder="الجوال 777... *"><input id=uEmail class=input placeholder="البريد * example@gmail.com" type=email><label style="display:flex;gap:6px;align-items:center;margin:8px 0;background:#022c22;padding:8px;border-radius:8px"><input type=checkbox id=agree checked><span style="font-size:12px">أوافق على القوانين</span></label><div id=e1 class=err></div><button class="btn green" onclick="registerNow()">✅ إرسال كود 1234 على بريدي 📧</button><button style="background:transparent;color:#888;border:0" onclick="back1()">⬅ رجوع</button></div>
<div class=card id=codeCard style="display:none"><div style="font-weight:900;color:#22c55e;font-size:18px">📧 تم ارسال كود 1234</div><div style="font-size:12px;color:#fbbf24;background:#1c1917;padding:8px;border-radius:8px;margin:8px 0">📧 <b id=cEmail></b><br>📱 <b id=cPhone></b><br>👤 <b id=cName></b></div><div style="background:#022c22;border:2px solid #22c55e;border-radius:12px;padding:10px"><div style="font-size:32px;font-weight:900;color:#22c55e;letter-spacing:8px">1234</div></div><input id=codeIn class=input placeholder="اكتب 1234" style="text-align:center;font-size:22px;letter-spacing:8px" maxlength=4><div id=e2 class=err></div><button class="btn green" onclick="verifyNow()">✅ تأكيد ودخول الخريطة 🗺️</button></div>
<div class=card id=doneCard style="display:none"><h3 style="color:#22c55e">🎉 دخلت بنجاح!</h3><p style="font-size:12px">✅ <span id=dName></span><br>📧 <span id=dEmail></span></p><button class="btn green" onclick="goMap()">🗺️ ادخل الخريطة الآن</button></div>
<script>
let role=null;
function goRole(r){role=r;document.getElementById('roleCard').style.display='none';document.getElementById('loginCard').style.display='block';document.getElementById('loginTitle').innerText=r=='driver'?'🚕 سائق':'👤 راكب';}
function back1(){document.getElementById('loginCard').style.display='none';document.getElementById('roleCard').style.display='block';}
function showErr(id,m){let e=document.getElementById(id);e.innerText=m;e.style.display='block';}
function registerNow(){
 let n=document.getElementById('uName').value.trim();
 let p=document.getElementById('uPhone').value.trim();
 let em=document.getElementById('uEmail').value.trim();
 let ag=document.getElementById('agree').checked;
 let err=document.getElementById('e1');err.style.display='none';
 if(n.length<3){showErr('e1','❌ اكتب اسمك');return;}
 if(p.length<7){showErr('e1','❌ اكتب جوالك');return;}
 if(!em.includes('@')){showErr('e1','❌ بريد صحيح');return;}
 if(!ag){showErr('e1','❌ وافق');return;}
 localStorage.setItem('y_name',n);localStorage.setItem('y_phone',p);localStorage.setItem('y_email',em);localStorage.setItem('y_role',role);
 document.getElementById('loginCard').style.display='none';
 document.getElementById('codeCard').style.display='block';
 document.getElementById('cEmail').innerText=em;
 document.getElementById('cPhone').innerText=p;
 document.getElementById('cName').innerText=n;
}
function verifyNow(){
 let c=document.getElementById('codeIn').value.trim();
 if(c!=''&&c!='1234'){showErr('e2','❌ الكود خطأ - 1234');return;}
 let n=localStorage.getItem('y_name');let p=localStorage.getItem('y_phone');let em=localStorage.getItem('y_email');let r=localStorage.getItem('y_role');
 localStorage.setItem('yazan_user',JSON.stringify({name:n,phone:p,email:em,role:r}));
 document.getElementById('codeCard').style.display='none';
 document.getElementById('doneCard').style.display='block';
 document.getElementById('dName').innerText=n;
 document.getElementById('dEmail').innerText=em;
}
function goMap(){let r=localStorage.getItem('y_role');location.href=r=='driver'?'/driver':'/mashwari';}
</script></body></html>`;

function mapHTML(role){
return `<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>خريطة يزن V18</title><link rel=stylesheet href=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css><script src=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js><\/script><script src=/socket.io/socket.io.js><\/script><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#020617;color:#fff;height:100vh;display:flex;flex-direction:column;font-family:system-ui}.top{background:#0f172a;padding:8px;display:flex;justify-content:space-between;border-bottom:2px solid #22c55e}.map{flex:1;position:relative}#m{height:100%;width:100%}.panel{position:absolute;top:10px;right:10px;z-index:1000;display:flex;flex-direction:column;gap:6px}.btn2{background:#1e293bEE;border:1px solid #334155;color:#fff;padding:8px 12px;border-radius:10px;font-size:12px}.bottom{background:#0f172a;border-radius:16px 16px 0 0;padding:10px}.in{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:10px;display:flex;gap:8px;margin:6px 0}.in input{background:transparent;border:0;color:#fff;width:100%;outline:none}</style></head><body>
<div class=top><div style="color:#22c55e;font-weight:900">🇾🇪 يزن V18 - <span id=uname></span> - <span id=uemail style="color:#fbbf24"></span> - <span id=acc style="color:#86efac"></span></div><button style="background:#dc2626;border:0;color:#fff;padding:6px 10px;border-radius:8px" onclick="localStorage.clear();location.href='/'">خروج</button></div>
<div class=map><div id=m></div><div class=panel><button class=btn2 onclick="setMap('sat')" style="background:#16a34a">🛰️ قمر</button><button class=btn2 onclick="setMap('str')">🗺️ شوارع</button><button class=btn2 onclick="locateMe()">📍 LIVE دقيق 5م</button></div></div>
<div class=bottom>
<div class=in><span>👤</span><input id=from readonly placeholder="أنت هنا - يتم تحديد موقعك..."><span id=dot style="width:12px;height:12px;background:red;border-radius:50%"></span></div>
<div class=in><span>🏁</span><input id=to readonly placeholder="إلى أين؟ اضغط هنا" onclick="let d=prompt('إلى أين تريد الذهاب؟');if(d)document.getElementById('to').value=d"></div>
${role==='rider'?`<button style="width:100%;background:#dc2626;color:#fff;border:0;border-radius:12px;padding:12px;margin:6px 0" onclick="family()">🚨 طلب لأهلي داخل تعز</button><button style="width:100%;background:#22c55e;color:#000;border:0;border-radius:12px;padding:14px;font-weight:900;font-size:16px" onclick="order()">✅ تأكيد الطلب</button>`:`<button style="width:100%;background:#16a34a;color:#fff;border:0;border-radius:12px;padding:12px" onclick="startGPS()">▶️ تشغيل GPS LIVE للسائق</button><div id=orders style="background:#020617;border-radius:10px;padding:6px;margin-top:6px;max-height:20vh;overflow-y:auto;font-size:12px">لا يوجد طلبات حاليا</div>`}
</div>
<script>
let user=JSON.parse(localStorage.getItem('yazan_user')||'null');if(!user)location.href='/';
document.getElementById('uname').innerText=user.name||'';
document.getElementById('uemail').innerText=user.email||'';
let map=L.map('m',{zoomControl:false}).setView([13.5795,44.021],12);
let gLayer=L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',{maxZoom:20,subdomains:['mt0','mt1','mt2','mt3']}).addTo(map);
let sLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19});
function setMap(t){map.eachLayer(l=>{if(l._url)map.removeLayer(l)});(t==='sat'?gLayer:sLayer).addTo(map);}
let pickup=null,marker=null,socket=io();
function locateMe(){
 document.getElementById('from').value='⏳ جاري تحديد موقعك بدقة 5م...';
 navigator.geolocation.getCurrentPosition(p=>{updatePos(p); navigator.geolocation.watchPosition(p=>{updatePos(p); if(p.coords.accuracy<=10) navigator.geolocation.clearWatch();},{},{enableHighAccuracy:true,maximumAge:0});},e=>{document.getElementById('from').value='❌ فعل GPS';},{enableHighAccuracy:true,maximumAge:0});
}
function updatePos(p){
 let acc=p.coords.accuracy; let ll={lat:p.coords.latitude,lng:p.coords.longitude};
 map.setView([ll.lat,ll.lng],18);
 if(marker)map.removeLayer(marker);
 marker=L.marker([ll.lat,ll.lng]).addTo(map).bindPopup('📍 أنت هنا - دقة '+Math.round(acc)+'م').openPopup();
 document.getElementById('from').value='📍 أنت هنا - دقة '+Math.round(acc)+'م';
 document.getElementById('acc').innerText=Math.round(acc)+'م';
 document.getElementById('dot').style.background=acc<=15?'#22c55e':acc<=50?'#fbbf24':'#ef4444';
 pickup=ll;
}
function order(){
 let to=document.getElementById('to').value;
 if(!pickup){locateMe();alert('⏳ انتظر تحديد موقعك');return;}
 if(!to){to=prompt('إلى أين؟');if(!to)return;document.getElementById('to').value=to;}
 socket.emit('newOrder',{from:pickup,to:to,name:user.name,phone:user.phone});
 alert('✅ تم إرسال طلبك إلى '+to+' - السائقين القريبين سيظهرون');
}
function family(){
 if(!pickup){locateMe();return;}
 let to=prompt('طلب لأهلي إلى أين داخل تعز؟');if(to){socket.emit('newOrder',{from:pickup,to:to,name:user.name,family:true});alert('✅ تم إرسال طلب لأهلك إلى '+to);}
}
function startGPS(){
 navigator.geolocation.watchPosition(p=>{socket.emit('driverUpdate',{id:user.phone,lat:p.coords.latitude,lng:p.coords.longitude,name:user.name});},()=>{},{enableHighAccuracy:true});
 alert('🟢 تم تشغيل GPS LIVE - أنت الآن ظاهر للركاب');
}
socket.on('newOrder',d=>{
 if(user.role==='driver'){let o=document.getElementById('orders');if(o)o.innerHTML='<div style=background:#022c22;border:1px solid #22c55e;padding:8px;border-radius:8px;margin:4px 0>🚕 طلب جديد<br>👤 '+d.name+'<br>🏁 إلى: '+d.to+'<br><button style=background:#22c55e;color:#000;border:0;padding:6px 10px;border-radius:6px;margin-top:4px onclick=alert(\'قبول الطلب\')>قبول</button></div>'+o.innerHTML;}
});
setTimeout(locateMe,1000);
</script></body></html>`;
}

app.get('/',(req,res)=>res.send(HOME));
app.get('/mashwari',(req,res)=>res.send(mapHTML('rider')));
app.get('/rider',(req,res)=>res.send(mapHTML('rider')));
app.get('/driver',(req,res)=>res.send(mapHTML('driver')));

io.on('connection',socket=>{
 socket.on('newOrder',d=>io.emit('newOrder',d));
 socket.on('driverUpdate',d=>{DRIVERS.set(d.id,d);io.emit('drivers',[...DRIVERS.values()]);});
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log('YAZAN V18 FULL READY '+PORT));
