const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));
app.use(express.json());

const YEMEN = {
  TAIZ: { lat: 13.5795, lng: 44.0210, name: "تعز" },
  SANAA: { lat: 15.3694, lng: 44.1910, name: "صنعاء" },
  ADEN: { lat: 12.7797, lng: 45.0367, name: "عدن" }
};

let cars = new Map();

// ================= مشواري V21 - خريطة تقرب + قمر صناعي + مناطق واضحة =================
app.get('/mashwari', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1">
<title>مشواري - تعز</title>
<link rel=stylesheet href=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css>
<script src=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui;background:#0f172a;color:#fff;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.header{background:#1e293b;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #22c55e}
.logo{color:#22c55e;font-weight:900;font-size:16px}
.badge{background:#22c55e;color:#000;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:900}
#map{flex:1;width:100%}
.controls{position:absolute;top:65px;right:10px;z-index:999;display:flex;flex-direction:column;gap:5px}
.ctrl{background:#1e293b;color:#fff;border:1px solid #334155;padding:7px 10px;border-radius:8px;font-size:12px}
.ctrl.green{background:#22c55e;color:#000;font-weight:900}
.regions{position:absolute;top:65px;left:10px;z-index:999;display:flex;flex-direction:column;gap:4px}
.reg{background:rgba(30,41,59,0.9);color:#fff;border:0;padding:5px 8px;border-radius:6px;font-size:11px;backdrop-filter:blur(5px)}
.sheet{background:#1e293b;border-radius:18px 18px 0 0;padding:12px}
.input{background:#0f172a;border:1px solid #334155;border-radius:10px;padding:10px;width:100%;color:#fff;margin:4px 0;font-size:13px}
.btn{background:#22c55e;color:#000;border:0;padding:12px;border-radius:12px;width:100%;font-weight:900;font-size:15px}
.info{color:#22c55e;font-weight:bold;text-align:center;margin:5px 0;font-size:13px}
.small{font-size:10px;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class=header><div class=logo>🚕 مشواري - تعز</div><div class=badge>🛰️ تقريب 22x | دقة 1 متر</div></div>
<div style=position:relative;flex:1;display:flex;flex-direction:column>
<div id=map></div>
<div class=controls>
<button class="ctrl green" onclick="setSat()">🛰️ قمر صناعي</button>
<button class=ctrl onclick="setMap()">🗺️ خريطة شوارع</button>
<button class=ctrl onclick="map.zoomIn()">🔍+ تقريب</button>
<button class=ctrl onclick="map.zoomOut()">🔍- تصغير</button>
</div>
<div class=regions>
<button class=reg onclick="map.setView([13.5795,44.0209],17)">📍 جمال</button>
<button class=reg onclick="map.setView([13.593542,43.986224],19)">🏘️ مدينة النور</button>
<button class=reg onclick="map.setView([13.585,44.015],17)">🏫 الحصب</button>
<button class=reg onclick="map.setView([13.595,44.03],17)">🕌 وادي القاضي</button>
<button class=reg onclick="map.setView([13.57,44.01],16)">🏔️ صالة</button>
</div>
</div>
<div class=sheet>
<input class=input id=from placeholder="📍 من: اضغط على الخريطة - حدد باب بيتك بدقة" readonly>
<input class=input id=to placeholder="🏁 إلى: اضغط على الخريطة" readonly>
<div class=info id=price>اضغط على الخريطة لتحديد - صبّعين للتقريب القوي</div>
<div class=small id=acc>خريطة حقيقية • تقريب حتى 22x • اسحب الدبوس لأدق نقطة 1 متر • زر القمر يوضح البيوت</div>
<button class=btn onclick="orderNow()">اطلب مشواري الآن 📍</button>
</div>
<script>
let map=L.map('map',{zoomControl:false,maxZoom:22,minZoom:10,zoomSnap:0.5}).setView([13.593542,43.986224],18);
let osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:22,maxNativeZoom:19}).addTo(map);
let sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:22});
let labels=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',{maxZoom:22});
function setSat(){map.removeLayer(osm);map.addLayer(sat);map.addLayer(labels);}
function setMap(){map.removeLayer(sat);map.removeLayer(labels);map.addLayer(osm);}
L.control.scale({metric:true,imperial:false}).addTo(map);
let pickup=null,dropoff=null,m1=null,m2=null;
map.on('click',e=>{
  let ll=e.latlng;
  if(!pickup || (pickup && dropoff)){
    pickup=ll;
    if(m1) map.removeLayer(m1);
    m1=L.marker(ll,{draggable:true}).addTo(map).bindPopup('📍 انطلاق<br>'+ll.lat.toFixed(6)+'<br><small>اسحب لتعديل 1 متر</small>').openPopup();
    m1.on('dragend',ev=>{pickup=ev.target.getLatLng();from.value=pickup.lat.toFixed(6)+','+pickup.lng.toFixed(6);calc();});
    dropoff=null; if(m2){map.removeLayer(m2);m2=null}
    from.value=ll.lat.toFixed(6)+','+ll.lng.toFixed(6)+' مدينة النور'; to.value=''; price.innerText='الآن حدد الوصول';
  }else{
    dropoff=ll;
    if(m2) map.removeLayer(m2);
    m2=L.marker(ll,{draggable:true}).addTo(map).bindPopup('🏁 وصول').openPopup();
    m2.on('dragend',ev=>{dropoff=ev.target.getLatLng();to.value=dropoff.lat.toFixed(6)+','+dropoff.lng.toFixed(6);calc();});
    to.value=ll.lat.toFixed(6)+','+ll.lng.toFixed(6); calc();
  }
});
function calc(){
  if(!pickup||!dropoff) return;
  let R=6371,dLa=(dropoff.lat-pickup.lat)*Math.PI/180,dLo=(dropoff.lng-pickup.lng)*Math.PI/180;
  let a=Math.sin(dLa/2)**2+Math.cos(pickup.lat*Math.PI/180)*Math.cos(dropoff.lat*Math.PI/180)*Math.sin(dLo/2)**2;
  let km=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  let m=Math.round(km*1000);
  let cost=800+km*150;
  price.innerText=m+' متر | '+Math.round(cost)+' ر.ي | دقة 1 متر 📍 '+pickup.lat.toFixed(6)+','+pickup.lng.toFixed(6);
}
function orderNow(){
  if(!pickup||!dropoff) return alert('حدد الانطلاق والوصول');
  alert('✅ تم طلب مشواري\\n📍 من: '+pickup.lat.toFixed(6)+','+pickup.lng.toFixed(6)+'\\n🏁 إلى: '+dropoff.lat.toFixed(6)+','+dropoff.lng.toFixed(6)+'\\n'+price.innerText);
}
<\/script>
</body>
</html>`);
});

app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), cars: cars.size }));
app.get('/ping', (req, res) => res.send('pong Yazan Taiz V21 ' + Date.now()));
app.get('/yemen', (req, res) => res.json(YEMEN));

io.on('connection', (socket) => {
  socket.on('update', (d) => { cars.set(socket.id, d); io.emit('cars', Array.from(cars.values())); });
  socket.on('disconnect', () => { cars.delete(socket.id); io.emit('cars', Array.from(cars.values())); });
});

// ================= منع النوم 24 ساعة =================
const SERVERS = [
  "https://yazan-world-v14-taiz.onrender.com",
  "https://yazan-world-v14-sanaa.onrender.com",
  "https://yazan-world-v14-aden.onrender.com"
];
setInterval(() => { fetch("https://yazan-world-v14-taiz.onrender.com/ping").catch(()=>{}); }, 5*60*1000);
setInterval(() => { SERVERS.forEach(u => fetch(u+"/ping").catch(()=>{})); }, 10*60*1000);

const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => console.log("Mashwari V21 Taiz - Zoom 22x + Satellite LIVE " + PORT));
