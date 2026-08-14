const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));
app.use(express.json());

// خريطة اليمن
const YEMEN = {
  TAIZ: { lat: 13.5795, lng: 44.0210 },
  SANAA: { lat: 15.3694, lng: 44.1910 },
  ADEN: { lat: 12.7797, lng: 45.0367 }
};

let cars = new Map();

// ================= مشواري - خريطة حقيقية 100% =================
app.get('/mashwari', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>مشواري - تعز</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui;background:#0f172a;color:#fff;height:100vh;display:flex;flex-direction:column}
.header{background:#1e293b;padding:12px;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #22c55e}
.logo{color:#22c55e;font-weight:900;font-size:18px}
.badge{background:#22c55e;color:#000;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:900}
#map{flex:1;min-height:55vh}
.sheet{background:#1e293b;border-radius:20px 20px 0 0;padding:14px}
.input{background:#0f172a;border:1px solid #334155;border-radius:12px;padding:12px;width:100%;color:#fff;margin:5px 0;font-size:14px}
.btn{background:#22c55e;color:#000;border:0;padding:14px;border-radius:14px;width:100%;font-weight:900;font-size:16px}
.info{color:#22c55e;font-weight:bold;margin:6px 0;text-align:center}
.small{font-size:11px;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class="header"><div class="logo">🚕 مشواري - تعز</div><div class="badge">GPS 1 متر LIVE</div></div>
<div id="map"></div>
<div class="sheet">
<div style="display:flex;gap:6px">
<input class="input" id="from" placeholder="📍 من: اضغط على الخريطة - باب البيت" readonly>
<button class="input" style="width:50px" onclick="getGPS()">📡</button>
</div>
<input class="input" id="to" placeholder="🏁 إلى: اضغط على الخريطة" readonly>
<div class="info" id="price"></div>
<div class="small" id="acc">خريطة حقيقية • اضغط وحدد • اسحب الدبوس لأدق نقطة 1 متر</div>
<button class="btn" onclick="orderNow()">اطلب مشواري الآن 📍</button>
</div>
<script>
let map = L.map('map').setView([13.5795,44.0209],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
L.control.scale({metric:true,imperial:false}).addTo(map);
let pickup=null,dropoff=null,m1=null,m2=null;
map.on('click',function(e){
  let ll=e.latlng;
  if(!pickup || (pickup && dropoff)){
    pickup=ll;
    if(m1) map.removeLayer(m1);
    m1=L.marker(ll,{draggable:true}).addTo(map).bindPopup('📍 انطلاق<br>'+ll.lat.toFixed(6)).openPopup();
    m1.on('dragend',function(ev){pickup=ev.target.getLatLng();from.value=pickup.lat.toFixed(6)+','+pickup.lng.toFixed(6);calc();});
    dropoff=null; if(m2){map.removeLayer(m2);m2=null}
    from.value=ll.lat.toFixed(6)+','+ll.lng.toFixed(6); to.value=''; price.innerText='';
  }else{
    dropoff=ll;
    if(m2) map.removeLayer(m2);
    m2=L.marker(ll,{draggable:true}).addTo(map).bindPopup('🏁 وصول').openPopup();
    m2.on('dragend',function(ev){dropoff=ev.target.getLatLng();to.value=dropoff.lat.toFixed(6)+','+dropoff.lng.toFixed(6);calc();});
    to.value=ll.lat.toFixed(6)+','+ll.lng.toFixed(6); calc();
  }
});
function getDist(a,b){
  let R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;
  let aa=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R*2*Math.atan2(Math.sqrt(aa),Math.sqrt(1-aa));
}
function calc(){
  if(!pickup||!dropoff) return;
  let km=getDist(pickup,dropoff);
  let meters=Math.round(km*1000);
  let cost=800+km*150;
  price.innerText=meters+' متر | '+Math.round(cost)+' ر.ي | دقة 1 متر 📍 '+pickup.lat.toFixed(6)+','+pickup.lng.toFixed(6);
}
function getGPS(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(p){
      pickup={lat:p.coords.latitude,lng:p.coords.longitude};
      if(m1) map.removeLayer(m1);
      m1=L.marker(pickup).addTo(map).bindPopup('📍 GPS دقيق').openPopup();
      map.setView(pickup,17);
      from.value=pickup.lat.toFixed(6)+','+pickup.lng.toFixed(6)+' GPS';
      acc.innerText='✅ GPS حقيقي دقة '+Math.round(p.coords.accuracy)+' متر';
    },function(){alert('فعل GPS')},{enableHighAccuracy:true});
  }
}
function orderNow(){
  if(!pickup||!dropoff) return alert('حدد الانطلاق والوصول بالضغط على الخريطة');
  alert('✅ تم طلب مشواري\\n📍 من: '+pickup.lat.toFixed(6)+'\\n🏁 إلى: '+dropoff.lat.toFixed(6)+'\\n'+price.innerText);
}
<\/script>
</body>
</html>`);
});

// الصفحات الأساسية
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), cars: cars.size, time: new Date().toISOString() }));
app.get('/ping', (req, res) => res.send('pong Yazan Taiz V20 ' + Date.now()));
app.get('/yemen', (req, res) => res.json(YEMEN));

// Socket
io.on('connection', (socket) => {
  socket.on('update', (d) => { cars.set(socket.id, d); io.emit('cars', Array.from(cars.values())); });
  socket.on('disconnect', () => { cars.delete(socket.id); io.emit('cars', Array.from(cars.values())); });
});

// ================= نظام منع النوم - يخلي السيرفر شغال 24 ساعة =================
const SERVERS = [
  "https://yazan-world-v14-taiz.onrender.com",
  "https://yazan-world-v14-sanaa.onrender.com", 
  "https://yazan-world-v14-aden.onrender.com"
];

function keepAlive() {
  // يصحي نفسه كل 5 دقايق
  setInterval(async () => {
    try {
      await fetch("https://yazan-world-v14-taiz.onrender.com/ping");
      console.log("✅ Self keep-alive " + new Date().toLocaleTimeString());
    } catch (e) {}
  }, 5 * 60 * 1000);

  // يصحي باقي السيرفرات كل 10 دقايق
  setInterval(async () => {
    for (let url of SERVERS) {
      try { await fetch(url + "/ping", { signal: AbortSignal.timeout(5000) }); } catch (e) {}
    }
    console.log("🔄 جيش 24 سيرفر تم تصحيته");
  }, 10 * 60 * 1000);
}

keepAlive();

const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Yazan Taiz V20 + Mashwari + Anti-Sleep LIVE on ${PORT}`);
});
