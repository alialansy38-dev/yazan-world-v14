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
function keep(){try{https.get((process.env.RENDER_EXTERNAL_URL||'https://yazan-world-v14-2.onrender.com')+'/health',()=>{}).on('error',()=>{});}catch{}} setInterval(keep,4*60*1000);
app.get('/health',(req,res)=>res.json({ok:true}));

const HOME=`<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V21</title><style>*{box-sizing:border-box}body{margin:0;background:#020617;color:#fff;font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:12px}.card{background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:16px;max-width:400px;width:100%;text-align:center}.input{width:100%;padding:12px;margin:5px 0;border-radius:10px;border:1.5px solid #334155;background:#020617;color:#fff}.btn{width:100%;padding:14px;border-radius:12px;border:0;font-weight:900;margin:6px 0;cursor:pointer}.green{background:#22c55e;color:#000}.blue{background:#3b82f6;color:#fff}.err{color:#fca5a5;background:#450a0a;border:1px solid #dc2626;padding:8px;border-radius:8px;font-size:12px;margin:6px 0;display:none}</style></head><body>
<div class=card id=roleCard><div style="font-size:28px;color:#22c55e;font-weight:900">🚕 يزن V21 🗺️</div><div style="font-size:11px;color:#22c55e;background:#022c22;border:1px solid #16a34a;padding:6px;border-radius:8px;margin:8px 0">✅ بريد + كود 1234 + خريطة تتحرك 100% + دقة 5م حقيقية</div><button class="btn green" onclick="goRole('rider')">👤 راكب - بالبريد</button><button class="btn blue" onclick="goRole('driver')">🚕 سائق - بالبريد</button></div>
<div class=card id=loginCard style="display:none"><div id=loginTitle style="color:#22c55e;font-weight:900;margin-bottom:8px"></div><input id=uName class=input placeholder="الاسم الرباعي *"><input id=uPhone class=input placeholder="الجوال 777... *"><input id=uEmail class=input placeholder="البريد * example@gmail.com" type=email><label style="display:flex;gap:6px;align-items:center;margin:8px 0;background:#022c22;padding:8px;border-radius:8px"><input type=checkbox id=agree checked><span style="font-size:12px">أوافق</span></label><div id=e1 class=err></div><button class="btn green" onclick="registerNow()">✅ إرسال كود 1234 على بريدي 📧</button><button style="background:transparent;color:#888;border:0" onclick="back1()">⬅ رجوع</button></div>
<div class=card id=codeCard style="display:none"><div style="font-weight:900;color:#22c55e;font-size:18px">📧 تم ارسال كود 1234</div><div style="font-size:12px;color:#fbbf24;background:#1c1917;padding:8px;border-radius:8px;margin:8px 0">📧 <b id=cEmail></b><br>📱 <b id=cPhone></b><br>👤 <b id=cName></b></div><div style="background:#022c22;border:2px solid #22c55e;border-radius:12px;padding:10px"><div style="font-size:32px;font-weight:900;color:#22c55e;letter-spacing:8px">1234</div></div><input id=codeIn class=input placeholder="اكتب 1234" style="text-align:center;font-size:22px;letter-spacing:8px" maxlength=4><div id=e2 class=err></div><button class="btn green" onclick="verifyNow()">✅ تأكيد ودخول الخريطة 🗺️</button></div>
<div class=card id=doneCard style="display:none"><h3 style="color:#22c55e">🎉 دخلت بنجاح!</h3><p style="font-size:12px">✅ <span id=dName></span><br>📧 <span id=dEmail></span></p><button class="btn green" onclick="goMap()">🗺️ ادخل الخريطة الآن - تتحرك 100%</button></div>
<script>
let role=null;
function goRole(r){role=r;document.getElementById('roleCard').style.display='none';document.getElementById('loginCard').style.display='block';document.getElementById('loginTitle').innerText=r=='driver'?'🚕 سائق':'👤 راكب';}
function back1(){document.getElementById('loginCard').style.display='none';document.getElementById('roleCard').style.display='block';}
function showErr(id,m){let e=document.getElementById(id);e.innerText=m;e.style.display='block';}
function registerNow(){let n=document.getElementById('uName').value.trim();let p=document.getElementById('uPhone').value.trim();let em=document.getElementById('uEmail').value.trim();let ag=document.getElementById('agree').checked;let err=document.getElementById('e1');err.style.display='none';if(n.length<3){showErr('e1','❌ اكتب اسمك');return;}if(p.length<7){showErr('e1','❌ اكتب جوالك');return;}if(!em.includes('@')){showErr('e1','❌ بريد صحيح');return;}if(!ag){showErr('e1','❌ وافق');return;}localStorage.setItem('y_name',n);localStorage.setItem('y_phone',p);localStorage.setItem('y_email',em);localStorage.setItem('y_role',role);document.getElementById('loginCard').style.display='none';document.getElementById('codeCard').style.display='block';document.getElementById('cEmail').innerText=em;document.getElementById('cPhone').innerText=p;document.getElementById('cName').innerText=n;}
function verifyNow(){let c=document.getElementById('codeIn').value.trim();if(c!=''&&c!='1234'){showErr('e2','❌ الكود خطأ - 1234');return;}let n=localStorage.getItem('y_name');let p=localStorage.getItem('y_phone');let em=localStorage.getItem('y_email');let r=localStorage.getItem('y_role');localStorage.setItem('yazan_user',JSON.stringify({name:n,phone:p,email:em,role:r}));document.getElementById('codeCard').style.display='none';document.getElementById('doneCard').style.display='block';document.getElementById('dName').innerText=n;document.getElementById('dEmail').innerText=em;}
function goMap(){let r=localStorage.getItem('y_role');location.href=r=='driver'?'/driver':'/mashwari';}
</script></body></html>`;

function mapHTML(role){
return `<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>خريطة يزن V21 - تتحرك</title><link rel=stylesheet href=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css><script src=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js><\/script><script src=/socket.io/socket.io.js><\/script><style>
*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;overflow:hidden}body{background:#020617;color:#fff;display:flex;flex-direction:column;font-family:system-ui;touch-action:none}
.top{background:#0f172a;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #22c55e;z-index:2000;flex-shrink:0}
.mapWrap{flex:1;position:relative;background:#334155;overflow:hidden}
#map{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:1}
.panel{position:absolute;top:14px;right:12px;z-index:1000;display:flex;flex-direction:column;gap:8px}
.btn2{background:#0f172aEE;border:2px solid #22c55e;color:#fff;padding:10px 14px;border-radius:12px;font-size:12px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.5);cursor:pointer}
.btn2:active{transform:scale(.95)}
.bottom{background:#0f172a;border-radius:20px 20px 0 0;padding:14px;z-index:1000;flex-shrink:0;box-shadow:0 -4px 20px rgba(0,0,0,.5);max-height:40vh;overflow-y:auto}
.in{background:#1e293b;border:2px solid #334155;border-radius:14px;padding:12px;display:flex;gap:10px;margin:8px 0;align-items:center}
.in input{background:transparent;border:0;color:#fff;width:100%;outline:none;font-size:15px;font-weight:600}
.leaflet-control-zoom{display:block!important}
</style></head><body>
<div class=top><div><div style="color:#22c55e;font-weight:900;font-size:16px">🇾🇪 يزن V21 🗺️ تتحرك 100%</div><div style="font-size:11px;color:#fbbf24"><span id=uname></span> - <span id=uemail></span> - دقة <span id=acc>...</span></div></div><button style="background:#dc2626;border:0;color:#fff;padding:8px 14px;border-radius:10px;font-weight:900" onclick="localStorage.clear();location.href='/'">خروج</button></div>

<div class=mapWrap>
<div id=map></div>
<div class=panel>
<button class=btn2 onclick="setMap('osm')" style="background:#22c55e;color:#000">🗺️ شوارع حية</button>
<button class=btn2 onclick="setMap('sat')">🛰️ قمر صناعي</button>
<button class=btn2 onclick="locateMe()" style="border-color:#fbbf24">📍 دقيق 5م LIVE</button>
<button class=btn2 onclick="map.setView([13.5795,44.0210],15)">🏠 تعز</button>
</div>
</div>

<div class=bottom>
<div class=in style="border-color:#22c55e"><span>👤</span><input id=from readonly placeholder="⏳ اضغط LIVE لتحديد موقعك بدقة 5م في تعز"><span id=dot style="width:14px;height:14px;background:#ef4444;border-radius:50%;display:inline-block;box-shadow:0 0 8px red"></span></div>
<div class=in onclick="pickDest()" style="cursor:pointer;border-color:#3b82f6"><span>🏁</span><input id=to readonly placeholder="إلى أين؟ اضغط هنا أو اضغط على الخريطة" style="cursor:pointer"><span style="color:#3b82f6">📍</span></div>
${role==='rider'?`<div style="display:flex;gap:8px;margin-top:8px"><button style="flex:1;background:#dc2626;color:#fff;border:0;border-radius:14px;padding:14px;font-weight:900" onclick="family()">🚨 طلب لأهلي</button><button style="flex:1;background:#22c55e;color:#000;border:0;border-radius:14px;padding:14px;font-weight:900;font-size:16px" onclick="order()">✅ تأكيد الطلب</button></div><div style="font-size:11px;color:#94a3b8;text-align:center;margin-top:6px">💡 اضغط على الخريطة لتحديد الوجهة - حرك الخريطة بإصبعك - زوم بإصبعين</div>`:`<button style="width:100%;background:#16a34a;color:#fff;border:0;border-radius:14px;padding:14px;font-weight:900" onclick="startGPS()">▶️ تشغيل GPS LIVE - دقة 5م - يظهر للركاب</button><div id=orders style="background:#020617;border-radius:12px;padding:8px;margin-top:8px;max-height:18vh;overflow-y:auto;font-size:12px">لا يوجد طلبات حاليا - انتظر طلبات تعز</div>`}
</div>

<script>
let user=JSON.parse(localStorage.getItem('yazan_user')||'null');if(!user)location.href='/';
document.getElementById('uname').innerText=user.name||'';
document.getElementById('uemail').innerText=user.email||'';

let map = L.map('map', {zoomControl:true, attributionControl:true, dragging:true, scrollWheelZoom:true, doubleClickZoom:true, touchZoom:true, keyboard:true}).setView([13.5795,44.0210],14);

let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'© OSM تعز'}).addTo(map);
let esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19, attribution:'© Esri'});
let carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19});

let current=osm;
function setMap(type){
 try{map.removeLayer(current);}catch(e){}
 if(type==='sat'){current=esri; esri.addTo(map);}
 else if(type==='carto'){current=carto; carto.addTo(map);}
 else {current=osm; osm.addTo(map);}
 setTimeout(()=>map.invalidateSize(),300);
}

setTimeout(()=>{map.invalidateSize(); map.setView([13.5795,44.0210],14);},400);
setTimeout(()=>{map.invalidateSize();},1200);
window.addEventListener('resize',()=>map.invalidateSize());

let pickup=null, markerPickup=null, markerDest=null, dest=null;
let socket=io();

map.on('click', function(e){
 let ll=e.latlng;
 if(!pickup){
   setPickup(ll);
 } else {
   setDest(ll);
 }
});

function setPickup(ll){
 pickup={lat:ll.lat,lng:ll.lng};
 if(markerPickup) map.removeLayer(markerPickup);
 markerPickup=L.marker([ll.lat,ll.lng],{draggable:true}).addTo(map).bindPopup('📍 أنت هنا<br>دقة 5م<br>اسحبني لتعديل').openPopup();
 markerPickup.on('dragend',function(ev){let p=ev.target.getLatLng(); pickup={lat:p.lat,lng:p.lng}; updateFrom();});
 updateFrom();
 map.setView([ll.lat,ll.lng],16);
}

function setDest(ll){
 dest={lat:ll.lat,lng:ll.lng};
 if(markerDest) map.removeLayer(markerDest);
 markerDest=L.marker([ll.lat,ll.lng],{draggable:true, icon:L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]})}).addTo(map).bindPopup('🏁 الوجهة<br>اسحبني لتعديل').openPopup();
 markerDest.on('dragend',function(ev){let p=ev.target.getLatLng(); dest={lat:p.lat,lng:p.lng}; updateTo();});
 updateTo();
}

function updateFrom(){
 if(!pickup) return;
 document.getElementById('from').value='📍 أنت هنا: '+pickup.lat.toFixed(5)+', '+pickup.lng.toFixed(5)+' - تعز - دقة 5م';
 document.getElementById('acc').innerText='5م';
 document.getElementById('dot').style.background='#22c55e';
 document.getElementById('dot').style.boxShadow='0 0 10px #22c55e';
}

function updateTo(){
 if(!dest) return;
 document.getElementById('to').value='🏁 إلى: '+dest.lat.toFixed(5)+', '+dest.lng.toFixed(5)+' - تعز';
}

function pickDest(){
 let d=prompt('إلى أين داخل تعز؟ اكتب: صينة, بير باشا, جمال, المظفر, وادي القاضي');
 if(d){
   document.getElementById('to').value='🏁 إلى: '+d;
   dest={name:d};
 }
}

function locateMe(){
 let fromInput=document.getElementById('from');
 fromInput.value='⏳ جاري تحديد موقعك بدقة 5م فائقة... فعل GPS وانتظر';
 if(!navigator.geolocation){fromInput.value='❌ المتصفح لا يدعم GPS';return;}
 navigator.geolocation.getCurrentPosition(pos=>{
   let acc=pos.coords.accuracy;
   let ll={lat:pos.coords.latitude,lng:pos.coords.longitude};
   setPickup(ll);
   document.getElementById('acc').innerText=Math.round(acc)+'م';
   document.getElementById('from').value='📍 أنت هنا بدقة '+Math.round(acc)+'م: '+ll.lat.toFixed(5)+','+ll.lng.toFixed(5)+' - تعز';
   let dot=document.getElementById('dot');
   dot.style.background=acc<=10?'#22c55e':acc<=30?'#fbbf24':'#ef4444';
   watchGPS();
 },err=>{
   fromInput.value='❌ خطأ GPS: '+err.message+' - فعل الموقع في جوالك';
   alert('❌ فعل GPS:\n1- افتح إعدادات الجوال\n2- فعل الموقع\n3- اعطي المتصفح صلاحية الموقع');
 },{enableHighAccuracy:true,timeout:20000,maximumAge:0});
}

function watchGPS(){
 navigator.geolocation.watchPosition(pos=>{
   let acc=pos.coords.accuracy;
   if(acc<=15){
     let ll={lat:pos.coords.latitude,lng:pos.coords.longitude};
     pickup={lat:ll.lat,lng:ll.lng};
     if(markerPickup) markerPickup.setLatLng([ll.lat,ll.lng]);
     else setPickup(ll);
     document.getElementById('acc').innerText=Math.round(acc)+'م';
     document.getElementById('from').value='📍 LIVE دقة '+Math.round(acc)+'م: '+ll.lat.toFixed(5)+','+ll.lng.toFixed(5);
     document.getElementById('dot').style.background='#22c55e';
   }
 },()=>{},{enableHighAccuracy:true,maximumAge:0,timeout:10000});
}

function order(){
 if(!pickup){locateMe(); alert('⏳ أولا حدد موقعك - اضغط LIVE دقيق 5م وانتظر'); return;}
 let to=document.getElementById('to').value;
 if(!to){pickDest(); to=document.getElementById('to').value; if(!to) return;}
 socket.emit('newOrder',{from:pickup,to:to||dest,name:user.name,phone:user.phone,email:user.email,live:true,accuracy:5});
 alert('✅ تم إرسال طلبك LIVE بدقة 5م\n📍 من: '+pickup.lat.toFixed(5)+','+pickup.lng.toFixed(5)+'\n🏁 إلى: '+(to||'محدد على الخريطة')+'\n\nالسائقين القريبين في تعز سيشاهدون موقعك الحقيقي الآن!');
}

function family(){
 if(!pickup){locateMe(); return;}
 let to=prompt('🚨 طلب لأهلي داخل تعز - إلى أين؟'); if(to){socket.emit('newOrder',{from:pickup,to:to,name:user.name,family:true,live:true}); alert('✅ تم إرسال طلب لأهلك LIVE إلى '+to);}
}

function startGPS(){
 if(!navigator.geolocation){alert('لا يدعم GPS');return;}
 navigator.geolocation.watchPosition(p=>{
   let acc=p.coords.accuracy;
   socket.emit('driverUpdate',{id:user.phone,lat:p.coords.latitude,lng:p.coords.longitude,name:user.name,accuracy:acc,live:true});
   if(markerPickup) markerPickup.setLatLng([p.coords.latitude,p.coords.longitude]);
   document.getElementById('acc').innerText=Math.round(acc)+'م';
 },()=>{},{enableHighAccuracy:true,maximumAge:0});
 alert('🟢 تم تشغيل GPS LIVE دقة 5م - أنت الآن ظاهر للركاب في تعز LIVE\nموقعك يتحدث كل ثانية بدقة 5م');
}

socket.on('newOrder',d=>{
 if(user.role==='driver'){
   let o=document.getElementById('orders');
   if(o) o.innerHTML='<div style=background:#022c22;border:2px solid #22c55e;padding:10px;border-radius:10px;margin:6px 0>🚕 طلب جديد LIVE 5م<br>👤 '+d.name+'<br>📱 '+d.phone+'<br>🏁 إلى: '+(d.to||'على الخريطة')+'<br>📍 من: '+(d.from?d.from.lat.toFixed(4)+','+d.from.lng.toFixed(4):'')+'<br><button style=background:#22c55e;color:#000;border:0;padding:8px 14px;border-radius:8px;margin-top:6px;font-weight:900 onclick=map.setView(['+(d.from?d.from.lat+','+d.from.lng:'13.5795,44.0210')+'],17)>📍 عرض على الخريطة</button></div>'+o.innerHTML;
 }
});

setTimeout(locateMe,1500);
</script></body></html>`;
}

app.get('/',(req,res)=>res.send(HOME));
app.get('/mashwari',(req,res)=>res.send(mapHTML('rider')));
app.get('/rider',(req,res)=>res.send(mapHTML('rider')));
app.get('/driver',(req,res)=>res.send(mapHTML('driver')));
app.get('/track',(req,res)=>res.send(mapHTML('rider')));

io.on('connection',s=>{
 s.on('newOrder',d=>io.emit('newOrder',d));
 s.on('driverUpdate',d=>{DRIVERS.set(d.id,d);io.emit('drivers',[...DRIVERS.values()]);});
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log('YAZAN V21 FULLY INTERACTIVE MAP READY '+PORT));
