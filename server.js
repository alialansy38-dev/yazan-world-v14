const express=require('express');const http=require('http');const {Server}=require('socket.io');const cors=require('cors');
const app=express();app.use(cors());app.use(express.json());
const server=http.createServer(app);const io=new Server(server,{cors:{origin:"*"}});
let users={},requests={},onlineDrivers={};

// ===== الصفحة الرئيسية V27 - نظيفة =====
const HOME=`<!DOCTYPE html><html dir=rtl><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>يزن وورلد V27 - جديد</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:system-ui}
body{background:#0f172a;color:#fff;height:100vh;display:flex;flex-direction:column}
.top{background:#1e293b;padding:10px;display:flex;gap:8px;align-items:center;justify-content:space-between}
.top b{color:#22c55e;font-size:18px}
.btn{padding:8px 14px;border:none;border-radius:8px;font-weight:bold;cursor:pointer}
.btn-green{background:#22c55e;color:#000}
.btn-blue{background:#3b82f6;color:#fff}
.btn-red{background:#ef4444;color:#fff}
.mapWrap{flex:1;position:relative}
#map{height:100%;width:100%}
.panel{position:absolute;bottom:10px;left:10px;right:10px;background:#1e293b;padding:12px;border-radius:12px;z-index:999}
.in{width:100%;padding:10px;border-radius:8px;border:2px solid #334155;background:#0f172a;color:#fff;margin:5px 0}
.vehicle{display:flex;gap:6px;margin:8px 0}
.vBtn{flex:1;padding:10px;border:2px solid #334155;border-radius:8px;background:#0f172a;color:#fff;cursor:pointer}
.vBtn.active{border-color:#22c55e;background:#14532d;color:#22c55e}
.row{display:flex;gap:6px}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:2000;align-items:center;justify-content:center}
.modal.open{display:flex}
.modalCard{background:#1e293b;padding:20px;border-radius:12px;width:90%;max-width:320px}
.govGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}
.govBtn{padding:10px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#fff;cursor:pointer}
.govBtn:hover{border-color:#22c55e}
</style></head><body>
<div class=top><div><b>🌍 يزن وورلد V27 جديد</b> <span id=uname></span></div><div style="display:flex;gap:6px"><button class=btn style="background:#334155" onclick="openGov()">🏛️ محافظة</button><button class=btn btn-green onclick="locateMe()">📍 موقعي</button></div></div>
<div class=mapWrap><div id=map></div>
<div class=panel>
<div class=row><input id=fromIn class=in placeholder="من: شارع جمال - تعز" style="flex:1"><button class=btn btn-blue onclick="pickOnMap('from')">📍</button></div>
<div class=row><input id=toIn class=in placeholder="إلى: أين تريد الذهاب؟" style="flex:1"><button class=btn btn-blue onclick="pickOnMap('to')">📍</button></div>
<div class=vehicle><button class=vBtn active id=vMoto onclick="setV('moto')">🛵 موتر</button><button class=vBtn id=vCar onclick="setV('car')">🚗 سيارة</button><button class=vBtn id=vBus onclick="setV('bus')">🚌 باص</button></div>
<div style="display:flex;gap:6px"><input id=priceIn class=in type=number placeholder="السعر ريال" style="flex:1"><input id=phoneIn class=in placeholder="رقمك 777..." style="flex:1"></div>
<button class="btn btn-green" style="width:100%;padding:12px;font-size:16px;margin-top:8px" onclick="sendFamily()">🚨 طلب أهلي - إرسال الآن</button>
<div id=status style="margin-top:6px;color:#22c55e;font-size:13px"></div>
</div></div>

<div class=modal id=govModal><div class=modalCard><b>اختر المحافظة</b><input id=govSearch class=in placeholder="ابحث: تعز، عدن، صنعاء..." oninput="filterGov()"><div class=govGrid id=govGrid></div><button class="btn btn-red" style="width:100%;margin-top:10px" onclick="closeGov()">إغلاق</button></div></div>

<script src="/socket.io/socket.io.js"></script>
<script>
let user=JSON.parse(localStorage.getItem('yazan_user')||'null'); if(!user){let n=prompt('اسمك؟')||'زائر';user={name:n,id:Date.now()};localStorage.setItem('yazan_user',JSON.stringify(user));}
document.getElementById('uname').innerText=user.name;
let map=L.map('map',{zoomControl:true}).setView([13.5795,44.02],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let markers={},pickMode=null,selectedVehicle='moto',fromPos=null,toPos=null;
const govs=[{n:'تعز',c:[13.5795,44.02]},{n:'عدن',c:[12.7855,45.0187]},{n:'صنعاء',c:[15.3694,44.1910]},{n:'إب',c:[13.9667,44.1833]},{n:'الحديدة',c:[14.8025,42.9511]},{n:'حضرموت',c:[15.9375,48.7914]},{n:'ذمار',c:[14.55,44.4]},{n:'عمران',c:[15.66,43.95]},{n:'المكلا',c:[14.541,49.12]},{n:'لحج',c:[13.05,44.88]},{n:'أبين',c:[13.25,45.38]},{n:'البيضاء',c:[13.97,45.57]}];
function renderGov(list){document.getElementById('govGrid').innerHTML=list.map(g=>'<button class=govBtn onclick="goGov(\\''+g.n+'\\','+g.c[0]+','+g.c[1]+')">'+g.n+'</button>').join('');}
renderGov(govs);
function openGov(){document.getElementById('govModal').classList.add('open');}
function closeGov(){document.getElementById('govModal').classList.remove('open');}
function filterGov(){let q=document.getElementById('govSearch').value.trim();let f=govs.filter(g=>g.n.includes(q));renderGov(f);}
function goGov(name,lat,lng){map.setView([lat,lng],13);L.marker([lat,lng]).addTo(map).bindPopup(name).openPopup();closeGov();document.getElementById('status').innerText='📍 انتقلنا إلى '+name;}
function locateMe(){map.locate({setView:true,maxZoom:15});map.on('locationfound',e=>{fromPos=e.latlng;if(markers.from)map.removeLayer(markers.from);markers.from=L.marker(e.latlng,{draggable:true}).addTo(map).bindPopup('📍 موقعك - مثبت').openPopup();document.getElementById('fromIn').value='موقعي الحالي - مثبت ✅';document.getElementById('status').innerText='✅ تم تثبيت موقعك';});}
function pickOnMap(type){pickMode=type;document.getElementById('status').innerText='👆 اضغط على الخريطة لتحديد '+ (type=='from'?'الانطلاق':'الوصول');}
map.on('click',e=>{if(!pickMode)return;if(pickMode=='from'){fromPos=e.latlng;document.getElementById('fromIn').value=e.latlng.lat.toFixed(4)+','+e.latlng.lng.toFixed(4)+' - مثبت 📌';if(markers.from)map.removeLayer(markers.from);markers.from=L.marker(e.latlng,{draggable:true}).addTo(map).bindPopup('📍 انطلاق - مثبت').openPopup();}else{toPos=e.latlng;document.getElementById('toIn').value=e.latlng.lat.toFixed(4)+','+e.latlng.lng.toFixed(4);if(markers.to)map.removeLayer(markers.to);markers.to=L.marker(e.latlng,{draggable:true}).addTo(map).bindPopup('🏁 وصول').openPopup();}pickMode=null;document.getElementById('status').innerText='✅ تم التثبيت';});
function setV(v){selectedVehicle=v;document.querySelectorAll('.vBtn').forEach(b=>b.classList.remove('active'));document.getElementById(v=='moto'?'vMoto':v=='car'?'vCar':'vBus').classList.add('active');}
const socket=io();
function sendFamily(){let price=document.getElementById('priceIn').value||'500';let phone=document.getElementById('phoneIn').value||'777';if(!fromPos){alert('حدد موقع الانطلاق أولا - اضغط 📍 موقعي');return;}let data={id:Date.now(),from:document.getElementById('fromIn').value,to:document.getElementById('toIn').value||'مفتوح',price,phone,vehicle:selectedVehicle,user:user.name,lat:fromPos.lat,lng:fromPos.lng,time:new Date().toLocaleString('ar-YE')};socket.emit('familyRequest',data);document.getElementById('status').innerHTML='🚨 تم إرسال طلب أهلي: '+data.vehicle+' - '+price+' ريال - جاري البحث عن سائق...';if('speechSynthesis' in window){let u=new SpeechSynthesisUtterance('تم إرسال طلبك، جاري البحث عن سائق');u.lang='ar-SA';speechSynthesis.speak(u);}}
socket.on('newFamilyRequest',d=>{let m=L.marker([d.lat,d.lng]).addTo(map).bindPopup('<b>🚨 طلب أهلي</b><br>'+d.from+'<br>إلى:'+d.to+'<br>'+d.vehicle+' - '+d.price+'ريال<br>'+d.user).openPopup();setTimeout(()=>map.removeLayer(m),60000);});
</script></body></html>`;

app.get('/',(req,res)=>res.send(HOME));
app.get('/health',(req,res)=>res.json({ok:true,v:'27-new',time:new Date().toISOString()}));

io.on('connection',socket=>{
  console.log('user connected',socket.id);
  socket.on('familyRequest',data=>{
    requests[data.id]=data;
    io.emit('newFamilyRequest',data);
    console.log('family',data);
  });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log('YAZAN V27 NEW running on',PORT));
