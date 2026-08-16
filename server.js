1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
201
202
203
204
205
206
207
208
209
210
211
212
213
214
215
216
217
218
219
220
221
222
223
224
const express=require('express');const http=require('http');const {Server}=require('socket.io');const cors=require('cors');const https=require('https');const app=express();const server=http.createServer(app);const io=new Server(server,{cors:{origin:"*"}});app.use(cors());app.use(express.json());let DRIVERS=new Map();function keep(){try{https.get((process.env.RENDER_EXTERNAL_URL||'https://yazan-world-v14-2.onrender.com')+'/health',()=>{}).on('error',()=>{});}catch{}}setInterval(keep,4*60*1000);app.get('/health',(req,res)=>res.json({ok:true}));
const HOME=`<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V25</title><style>*{box-sizing:border-box}body{margin:0;background:#020617;color:#fff;font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:12px}.card{background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:16px;max-width:400px;width:100%;text-align:center}.input{width:100%;padding:12px;margin:5px 0;border-radius:10px;border:1.5px solid #334155;background:#020617;color:#fff}.btn{width:100%;padding:14px;border-radius:12px;border:0;font-weight:900;margin:6px 0;cursor:pointer}.green{background:#22c55e;color:#000}.blue{background:#3b82f6;color:#fff}.err{color:#fca5a5;background:#450a0a;border:1px solid #dc2626;padding:8px;border-radius:8px;font-size:12px;margin:6px 0;display:none}</style></head><body><div class=card id=roleCard><div style="font-size:28px;color:#22c55e;font-weight:900">🚕 يزن V25 🔓</div><div style="font-size:11px;color:#22c55e;background:#022c22;border:1px solid #16a34a;padding:6px;border-radius:8px;margin:8px 0">✅ طلب أهلي يشتغل + بحث محافظات + تثبيت علامة</div><button class="btn green" onclick="goRole('rider')">👤 راكب</button><button class="btn blue" onclick="goRole('driver')">🚕 سائق</button></div><div class=card id=loginCard style="display:none"><input id=uName class=input placeholder="الاسم الرباعي *"><input id=uPhone class=input placeholder="الجوال 777... *"><input id=uEmail class=input placeholder="البريد * example@gmail.com" type=email><label style="display:flex;gap:6px;align-items:center;margin:8px 0;background:#022c22;padding:8px;border-radius:8px"><input type=checkbox id=agree checked><span style="font-size:12px">أوافق</span></label><div id=e1 class=err></div><button class="btn green" onclick="registerNow()">✅ إرسال كود 1234 📧</button><button style="background:transparent;color:#888;border:0" onclick="back1()">⬅ رجوع</button></div><div class=card id=codeCard style="display:none"><div style="font-weight:900;color:#22c55e;font-size:18px">📧 كود 1234</div><div style="font-size:12px;color:#fbbf24;background:#1c1917;padding:8px;border-radius:8px;margin:8px 0">📧 <b id=cEmail></b><br>📱 <b id=cPhone></b><br>👤 <b id=cName></b></div><div style="background:#022c22;border:2px solid #22c55e;border-radius:12px;padding:10px"><div style="font-size:32px;font-weight:900;color:#22c55e;letter-spacing:8px">1234</div></div><input id=codeIn class=input placeholder="اكتب 1234" style="text-align:center;font-size:22px;letter-spacing:8px" maxlength=4 inputmode=numeric><div id=e2 class=err></div><button class="btn green" onclick="verifyNow()">✅ تأكيد</button></div><div class=card id=doneCard style="display:none"><h3 style="color:#22c55e">🎉 دخلت بنجاح!</h3><p style="font-size:12px">✅ <span id=dName></span><br>📧 <span id=dEmail></span></p><button class="btn green" onclick="goMap()">🗺️ ادخل الخريطة V25</button></div><script>let role=null;function goRole(r){role=r;document.getElementById('roleCard').style.display='none';document.getElementById('loginCard').style.display='block';}function back1(){document.getElementById('loginCard').style.display='none';document.getElementById('roleCard').style.display='block';}function showErr(id,m){let e=document.getElementById(id);e.innerText=m;e.style.display='block';}function registerNow(){let n=document.getElementById('uName').value.trim();let p=document.getElementById('uPhone').value.trim();let em=document.getElementById('uEmail').value.trim();let ag=document.getElementById('agree').checked;let err=document.getElementById('e1');err.style.display='none';if(n.length<3){showErr('e1','❌ اكتب اسمك');return;}if(p.length<7){showErr('e1','❌ اكتب جوالك');return;}if(!em.includes('@')){showErr('e1','❌ بريد صحيح');return;}if(!ag){showErr('e1','❌ وافق');return;}localStorage.setItem('y_name',n);localStorage.setItem('y_phone',p);localStorage.setItem('y_email',em);localStorage.setItem('y_role',role);document.getElementById('loginCard').style.display='none';document.getElementById('codeCard').style.display='block';document.getElementById('cEmail').innerText=em;document.getElementById('cPhone').innerText=p;document.getElementById('cName').innerText=n;}function verifyNow(){let c=document.getElementById('codeIn').value.trim();if(c!='1234'){showErr('e2','❌ اكتب 1234');return;}let n=localStorage.getItem('y_name');let p=localStorage.getItem('y_phone');let em=localStorage.getItem('y_email');let r=localStorage.getItem('y_role');localStorage.setItem('yazan_user',JSON.stringify({name:n,phone:p,email:em,role:r}));document.getElementById('codeCard').style.display='none';document.getElementById('doneCard').style.display='block';document.getElementById('dName').innerText=n;document.getElementById('dEmail').innerText=em;}function goMap(){let r=localStorage.getItem('y_role');location.href=r=='driver'?'/driver':'/mashwari';}<\/script></body></html>`;
function mapHTML(role){return `<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>يزن V25 - طلب أهلي شغال</title><link rel=stylesheet href=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css><script src=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js><\/script><script src=/socket.io/socket.io.js><\/script><style>
*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%}body{background:#020617;color:#fff;display:flex;flex-direction:column;font-family:system-ui}
.top{background:#0f172a;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #22c55e;z-index:2000;flex-shrink:0}
.mapWrap{flex:1;position:relative;background:#334155;overflow:hidden}
#map{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:1}
.panel{position:absolute;top:10px;right:10px;z-index:1000;display:flex;flex-direction:column;gap:6px;max-width:48%}
.btn2{background:#0f172aEE;border:2px solid #22c55e;color:#fff;padding:8px 10px;border-radius:10px;font-size:11px;font-weight:800;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.5)}
.bottom{background:#0f172a;border-radius:20px 20px 0 0;padding:12px;z-index:1000;flex-shrink:0;box-shadow:0 -4px 20px rgba(0,0,0,.5);max-height:62vh;overflow-y:auto}
.in{background:#1e293b;border:2px solid #334155;border-radius:12px;padding:10px;display:flex;gap:8px;margin:6px 0;align-items:center}
.in input, .in select{background:transparent;border:0;color:#fff;width:100%;outline:none;font-size:14px;font-weight:600}
.vehicle{display:flex;gap:6px;margin:8px 0}
.vBtn{flex:1;padding:8px 4px;border-radius:10px;border:2px solid #334155;background:#1e293b;color:#fff;font-size:10px;font-weight:800;cursor:pointer;text-align:center}
.vBtn.active{border-color:#22c55e;background:#022c22;color:#22c55e}
.priceBox{background:#022c22;border:2px solid #22c55e;border-radius:12px;padding:10px;margin:8px 0;text-align:center;display:none}
.modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.8);z-index:5000;display:none;justify-content:center;align-items:center;padding:16px}
.modalCard{background:#0f172a;border:2px solid #22c55e;border-radius:16px;padding:16px;max-width:400px;width:100%;max-height:80vh;overflow-y:auto}
.govBtn{background:#1e293b;border:1px solid #334155;color:#fff;padding:10px;border-radius:10px;margin:4px 0;width:100%;text-align:right;cursor:pointer;font-weight:600}
.govBtn:hover{background:#334155;border-color:#22c55e}
</style></head><body>
<div class=top><div><div style="color:#22c55e;font-weight:900;font-size:13px">🇾🇪 يزن V25 - طلب أهلي شغال + محافظات + تثبيت علامة</div><div style="font-size:10px;color:#fbbf24"><span id=uname></span> - <span id=acc>...</span> - <span id=distInfo></span></div></div><button style="background:#dc2626;border:0;color:#fff;padding:6px 10px;border-radius:8px;font-weight:900;font-size:11px" onclick="localStorage.clear();location.href='/'">خروج</button></div>

<div class=mapWrap>
<div id=map></div>
<div class=panel>
<button class=btn2 onclick="setMap('osm')" style="background:#22c55e;color:#000">🗺️ شوارع حية</button>
<button class=btn2 onclick="setMap('sat')">🛰️ قمر</button>
<button class=btn2 onclick="locateMe()" style="border-color:#fbbf24">📍 LIVE 5م</button>
<button class=btn2 onclick="openGovModal()" style="border-color:#3b82f6;background:#1e293b">🏛️ بحث محافظات</button>
<button class=btn2 onclick="toggleTracking()" id=trackBtn style="border-color:#ef4444;background:#450a0a">📡 تتبع OFF</button>
<button class=btn2 onclick="fixMarker()" id=fixBtn style="border-color:#fbbf24;background:#422006;display:none">📌 تثبيت العلامة</button>
</div>
</div>

<div class=bottom>
<div class=in style="border-color:#22c55e"><span>👤</span><input id=from readonly placeholder="📍 موقعك LIVE دقة 5م"><span id=dot style="width:12px;height:12px;background:#ef4444;border-radius:50%;display:inline-block"></span><button style="background:#22c55e;color:#000;border:0;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:900;margin-right:6px" onclick="fixMarker()">📌 تثبيت</button></div>

<div class="in editable" style="border-color:#3b82f6"><span>🏁</span><input id=to type=text placeholder="إلى أين؟ اكتب شارع جمال وينتقل تلقائيا" oninput="onDestInput(this.value)" autocomplete=off><span style="color:#3b82f6">✏️</span><button style="background:#3b82f6;color:#fff;border:0;padding:6px 10px;border-radius:8px;font-size:11px" onclick="openGovModal()">🏛️</button></div>

<div class=vehicle>
<button class=vBtn active id=vMoto onclick="selectVehicle('moto','🏍️ موتر',400)">🏍️<br>موتر<br>400</button>
<button class=vBtn id=vCar onclick="selectVehicle('car','🚗 سيارة',600)">🚗<br>سيارة<br>600</button>
<button class=vBtn id=vBus onclick="selectVehicle('bus','🚐 باص',300)">🚐<br>باص<br>300</button>
<button class=vBtn id=vTruck onclick="selectVehicle('truck','🚚 دباب',500)">🚚<br>دباب<br>500</button>
</div>

<div class=priceBox id=priceBox>
<div style="display:flex;justify-content:space-between;font-size:12px"><span>📏 المسافة:</span><b id=pDist>0 كم</b></div>
<div style="display:flex;justify-content:space-between;font-size:12px"><span>⏱️ الوقت:</span><b id=pTime>0 د</b></div>
<div style="display:flex;justify-content:space-between;font-size:14px;color:#22c55e;font-weight:900;border-top:1px solid #334155;margin-top:6px;padding-top:6px"><span>💰 السعر:</span><b id=pPrice>0 ر.ي</b></div>
</div>

<div style="display:flex;gap:6px;margin-top:8px">
<button style="flex:1;background:#dc2626;color:#fff;border:0;border-radius:12px;padding:12px;font-weight:900" onclick="family()" id=familyBtn>🚨 طلب لأهلي داخل تعز<br><span style="font-size:10px">يحدد على الخريطة + نوع مركبة</span></button>
<button style="flex:1;background:#7c3aed;color:#fff;border:0;border-radius:12px;padding:12px;font-weight:900" onclick="startVoice()">🎤 صوت</button>
</div>

<div style="display:flex;gap:6px;margin-top:6px">
<button style="flex:1;background:#0f172a;border:2px solid #22c55e;color:#22c55e;border-radius:12px;padding:12px;font-weight:900" onclick="toggleTracking()" id=trackBtn2>📡 تتبع حقيقي للطرفين</button>
<button style="flex:1;background:#22c55e;color:#000;border:0;border-radius:14px;padding:14px;font-weight:900;font-size:14px" onclick="order()">✅ تأكيد الطلب<br><span style="font-size:11px" id=orderPrice>احسب السعر</span></button>
</div>
</div>

<div class=modal id=govModal>
<div class=modalCard>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="color:#22c55e">🏛️ بحث المحافظات</h3><button style="background:#dc2626;border:0;color:#fff;padding:6px 10px;border-radius:8px" onclick="closeGovModal()">✕</button></div>
<input id=govSearch type=text placeholder="ابحث محافظة: تعز, صنعاء, عدن..." style="width:100%;padding:10px;border-radius:10px;border:2px solid #334155;background:#020617;color:#fff;margin-bottom:10px" oninput="filterGov(this.value)">
<div id=govList></div>
<div style="display:flex;gap:8px;margin-top:12px"><button style="flex:1;background:#334155;color:#fff;border:0;padding:10px;border-radius:10px" onclick="closeGovModal()">إلغاء</button><button style="flex:1;background:#22c55e;color:#000;border:0;padding:10px;border-radius:10px;font-weight:900" onclick="confirmGov()">✅ أوكه - انتقال</button></div>
</div>
</div>

<div class=modal id=familyModal>
<div class=modalCard>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="color:#ef4444">🚨 طلب لأهلي داخل تعز</h3><button style="background:#334155;border:0;color:#fff;padding:6px 10px;border-radius:8px" onclick="closeFamilyModal()">✕</button></div>
<input id=familyTo type=text placeholder="إلى أين؟ شارع جمال, بير باشا, صينة..." style="width:100%;padding:12px;border-radius:10px;border:2px solid #ef4444;background:#020617;color:#fff;margin-bottom:10px">
<input id=familyPhone type=text placeholder="جوال الأهل (اختياري)" style="width:100%;padding:10px;border-radius:10px;border:2px solid #334155;background:#020617;color:#fff;margin-bottom:10px">
<div style="font-size:12px;color:#fbbf24;margin-bottom:8px">اختر نوع المركبة للأهل:</div>
<div class=vehicle>
<button class=vBtn active id=fvMoto onclick="selectFamilyVehicle('moto','🏍️ موتر',400)">🏍️ موتر</button>
<button class=vBtn id=fvCar onclick="selectFamilyVehicle('car','🚗 سيارة',600)">🚗 سيارة</button>
<button class=vBtn id=fvBus onclick="selectFamilyVehicle('bus','🚐 باص',300)">🚐 باص</button>
</div>
<div id=familyPrice style="background:#022c22;border:1px solid #ef4444;border-radius:8px;padding:8px;margin:8px 0;text-align:center;font-size:12px;display:none"></div>
<div style="display:flex;gap:8px;margin-top:12px"><button style="flex:1;background:#334155;color:#fff;border:0;padding:12px;border-radius:10px" onclick="closeFamilyModal()">إلغاء</button><button style="flex:1;background:#dc2626;color:#fff;border:0;padding:12px;border-radius:10px;font-weight:900" onclick="confirmFamilyOrder()">🚨 تأكيد طلب الأهلي</button></div>
</div>
</div>

<script>
let user=JSON.parse(localStorage.getItem('yazan_user')||'null');if(!user)location.href='/';
document.getElementById('uname').innerText=user.name||'';
let map=L.map('map',{zoomControl:true,dragging:true,scrollWheelZoom:true,doubleClickZoom:true,touchZoom:true,tap:true}).setView([13.5795,44.0210],13);
let osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OSM'}).addTo(map);
let esri=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19});
let current=osm;
function setMap(type){try{map.removeLayer(current);}catch(e){} if(type==='sat'){current=esri;esri.addTo(map);}else{current=osm;osm.addTo(map);} setTimeout(()=>map.invalidateSize(),300);}
setTimeout(()=>map.invalidateSize(),500);setTimeout(()=>map.invalidateSize(),1500);
window.addEventListener('resize',()=>map.invalidateSize());
let pickup=null,markerPickup=null,markerDest=null,dest=null,destName='',selectedVehicle={type:'moto',name:'🏍️ موتر',pricePerKm:400},familyVehicle={type:'moto',name:'🏍️ موتر',pricePerKm:400},isTracking=false,socket=io(),selectedGov=null,markerFixed=false;

const GOVS=[
{name:'تعز',lat:13.5795,lng:44.0210,districts:['القاهرة','المظفر','صالة','التعزية','ماوية','شرعب','مقبنة','صبر']},
{name:'صنعاء',lat:15.3694,lng:44.1910,districts:['السبعين','معين','شعوب','صنعاء القديمة']},
{name:'عدن',lat:12.7855,lng:45.0187,districts:['المعلا','التواهي','خور مكسر','الشيخ عثمان']},
{name:'الحديدة',lat:14.7979,lng:42.9544,districts:['الحوك','الميناء','الحالي']},
{name:'إب',lat:13.9667,lng:44.1667,districts:['الظهار','المشنة']},
{name:'ذمار',lat:14.55,lng:44.4018},
{name:'حضرموت - المكلا',lat:14.5422,lng:49.1242},
{name:'مأرب',lat:15.4244,lng:45.3222},
{name:'الجوف',lat:16.55,lng:44.45},
{name:'صعدة',lat:16.9397,lng:43.7634},
{name:'حجة',lat:15.6946,lng:43.6023},
{name:'عمران',lat:15.6442,lng:43.9449},
{name:'المحويت',lat:15.47,lng:43.54},
{name:'ريمة',lat:14.66,lng:43.68},
{name:'البيضاء',lat:13.9754,lng:45.5712},
{name:'شبوة',lat:14.54,lng:47.38},
{name:'أبين',lat:13.27,lng:45.30},
{name:'لحج',lat:13.05,lng:44.88},
{name:'الضالع',lat:13.70,lng:44.71},
{name:'المهرة',lat:16.0,lng:52.0},
{name:'سقطرى',lat:12.5,lng:53.82}
];

const PLACES={'شارع جمال':[13.5795,44.0210],'جمال':[13.5795,44.0210],'بير باشا':[13.565,44.015],'صينة':[13.585,44.03],'وادي القاضي':[13.57,44.02],'المظفر':[13.575,44.018],'باب موسى':[13.58,44.022],'الحوبان':[13.55,44.01],'عصيفرة':[13.59,44.025]};

map.on('click',function(e){let ll=e.latlng; if(!pickup){setPickup(ll);}else{setDest(ll); document.getElementById('fixBtn').style.display='block';}});

function setPickup(ll,fix=false){
 pickup={lat:ll.lat,lng:ll.lng,fixed:fix};
 if(markerPickup)map.removeLayer(markerPickup);
 let icon = fix? L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]}): undefined;
 markerPickup=L.marker([ll.lat,ll.lng],{draggable:!fix,icon:icon}).addTo(map).bindPopup((fix?'📌 مثبت: ':'📍 ')+'أنت هنا<br>'+(fix?'تم تثبيت العلامة':'اسحب لتعديل ثم ثبت')).openPopup();
 if(!fix){markerPickup.on('dragend',function(ev){let p=ev.target.getLatLng();pickup={lat:p.lat,lng:p.lng,fixed:false};updateFrom();calcPrice();});}
 updateFrom(); if(!fix) map.setView([ll.lat,ll.lng],16); calcPrice();
}

function setDest(ll,name){
 dest={lat:ll.lat,lng:ll.lng,name:name||destName};
 if(markerDest)map.removeLayer(markerDest);
 markerDest=L.marker([ll.lat,ll.lng],{draggable:true,icon:L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]})}).addTo(map).bindPopup('🏁 '+(name||'الوجهة')+'<br><button onclick=fixDestMarker() style=background:#22c55e;color:#000;border:0;padding:4px 8px;border-radius:6px>📌 تثبيت</button>').openPopup();
 markerDest.on('dragend',function(ev){let p=ev.target.getLatLng();dest={lat:p.lat,lng:p.lng,name:destName};updateTo();calcPrice();});
 updateTo(); calcPrice();
 document.getElementById('fixBtn').style.display='block';
}

function fixMarker(){
 if(!pickup){alert('❌ حدد موقعك أولا على الخريطة');return;}
 if(markerPickup)map.removeLayer(markerPickup);
 setPickup(pickup,true);
 markerFixed=true;
 document.getElementById('fixBtn').innerText='✅ مثبت';
 document.getElementById('fixBtn').style.background='#022c22';
 document.getElementById('fixBtn').style.borderColor='#22c55e';
 setTimeout(()=>{document.getElementById('fixBtn').style.display='none';},2000);
 alert('📌 تم تثبيت علامة موقعك\\n📍 '+pickup.lat.toFixed(5)+','+pickup.lng.toFixed(5)+'\\nالآن لن تتحرك حتى تفك التثبيت');
}

function fixDestMarker(){
 if(!dest){return;}
 if(markerDest)map.removeLayer(markerDest);
 let fixedIcon=L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]});
 markerDest=L.marker([dest.lat,dest.lng],{draggable:false,icon:fixedIcon}).addTo(map).bindPopup('📌 مثبت: '+(dest.name||'الوجهة')).openPopup();
 dest.fixed=true;
}

function updateFrom(){if(!pickup)return;document.getElementById('from').value='📍 '+(pickup.fixed?'📌 مثبت: ':'')+pickup.lat.toFixed(5)+','+pickup.lng.toFixed(5)+' - تعز - دقة 5م'+(pickup.fixed?' - مثبت':'' );document.getElementById('acc').innerText=(pickup.fixed?'📌 مثبت - ':'')+'5م LIVE';document.getElementById('dot').style.background='#22c55e';}
function updateTo(){if(!dest)return;if(dest.name){document.getElementById('to').value=dest.name+(dest.fixed?' 📌 مثبت':'');}else{document.getElementById('to').value='🏁 إلى: '+dest.lat.toFixed(5)+','+dest.lng.toFixed(5)+(dest.fixed?' 📌':'' );}}

function onDestInput(val){
 destName=val; dest={name:val,lat:13.5795,lng:44.0210};
 let lower=val.toLowerCase();
 for(let key in PLACES){
   if(lower.includes(key) || key.includes(lower) || lower.includes(key.split(' ')[0])){
     let coords=PLACES[key]; dest={name:key,lat:coords[0],lng:coords[1]}; map.setView([coords[0],coords[1]],16); setDest({lat:coords[0],lng:coords[1]},key); break;
   }
 }
 calcPrice();
}

function selectVehicle(type,name,price){selectedVehicle={type:type,name:name,pricePerKm:price};document.querySelectorAll('.vBtn').forEach(b=>{if(b.id.startsWith('v') && !b.id.startsWith('fv')) b.classList.remove('active');});let el=document.getElementById('v'+type.charAt(0).toUpperCase()+type.slice(1)); if(el) el.classList.add('active'); calcPrice();}
function selectFamilyVehicle(type,name,price){familyVehicle={type:type,name:name,pricePerKm:price};document.querySelectorAll('[id^=fv]').forEach(b=>b.classList.remove('active'));let el=document.getElementById('fv'+type.charAt(0).toUpperCase()+type.slice(1)); if(el) el.classList.add('active'); calcFamilyPrice();}

function calcDistance(p1,p2){if(!p1||!p2) return 0;let R=6371;let dLat=(p2.lat-p1.lat)*Math.PI/180;let dLon=(p2.lng-p1.lng)*Math.PI/180;let a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(p1.lat*Math.PI/180)*Math.cos(p2.lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);let c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));return R*c;}
function calcPrice(){if(!pickup||!dest){return;}let dist=calcDistance(pickup,dest);if(dist===0 && dest.name){dist=2.5+Math.random()*3;}let price=Math.round(dist*selectedVehicle.pricePerKm);let time=Math.round(dist*4+3);document.getElementById('priceBox').style.display='block';document.getElementById('pDist').innerText=dist.toFixed(2)+' كم';document.getElementById('pTime').innerText=time+' د';document.getElementById('pPrice').innerText=price.toLocaleString()+' ر.ي';document.getElementById('orderPrice').innerText=price.toLocaleString()+' ر.ي - '+dist.toFixed(1)+' كم';document.getElementById('distInfo').innerText=dist.toFixed(1)+'كم - '+price.toLocaleString()+'ر.ي';return {dist,time,price};}
function calcFamilyPrice(){if(!pickup) return;let fakeDest={lat:pickup.lat+0.02,lng:pickup.lng+0.02};if(dest) fakeDest=dest;let dist=calcDistance(pickup,fakeDest);if(dist<0.5) dist=2.5;let price=Math.round(dist*familyVehicle.pricePerKm);let el=document.getElementById('familyPrice');if(el){el.style.display='block';el.innerHTML='📏 '+dist.toFixed(2)+' كم - ⏱️ '+Math.round(dist*4)+' د - 💰 '+price.toLocaleString()+' ر.ي - '+familyVehicle.name;}}

function openGovModal(){document.getElementById('govModal').style.display='flex';renderGovList(GOVS);}
function closeGovModal(){document.getElementById('govModal').style.display='none';}
function renderGovList(list){let html='';list.forEach(g=>{html+='<button class=govBtn onclick=selectGov(\\''+g.name+'\\','+g.lat+','+g.lng+')>🏛️ '+g.name+' - '+g.lat.toFixed(2)+','+g.lng.toFixed(2)+'</button>';});document.getElementById('govList').innerHTML=html||'<div style=color:#94a3b8>لا يوجد نتائج</div>';}
function filterGov(q){let lower=q.toLowerCase();let filtered=GOVS.filter(g=>g.name.includes(q)||g.name.toLowerCase().includes(lower));renderGovList(filtered);}
function selectGov(name,lat,lng){selectedGov={name:name,lat:lat,lng:lng};document.querySelectorAll('.govBtn').forEach(b=>b.style.borderColor='#334155');event.target.style.borderColor='#22c55e';event.target.style.background='#022c22';document.getElementById('govSearch').value=name;}
function confirmGov(){if(!selectedGov){let val=document.getElementById('govSearch').value;if(!val){alert('اختر محافظة أولا');return;}let found=GOVS.find(g=>g.name.includes(val));if(found) selectedGov=found; else {alert('اختر من القائمة');return;}}map.setView([selectedGov.lat,selectedGov.lng],12);setPickup({lat:selectedGov.lat,lng:selectedGov.lng});setDest({lat:selectedGov.lat+0.02,lng:selectedGov.lng+0.02},selectedGov.name);closeGovModal();alert('✅ تم الانتقال إلى محافظة '+selectedGov.name+'\\n📍 '+selectedGov.lat.toFixed(4)+','+selectedGov.lng.toFixed(4)+'\\nاضغط أوكه ثم حدد موقعك بدقة');}

function family(){document.getElementById('familyModal').style.display='flex';document.getElementById('familyTo').value=document.getElementById('to').value||'';calcFamilyPrice();}
function closeFamilyModal(){document.getElementById('familyModal').style.display='none';}
function confirmFamilyOrder(){
 let to=document.getElementById('familyTo').value.trim();
 let phone=document.getElementById('familyPhone').value.trim();
 if(!to){alert('❌ اكتب إلى أين؟ مثلا: شارع جمال');return;}
 if(!pickup){alert('❌ حدد موقعك أولا على الخريطة ثم ثبت العلامة');locateMe();return;}
 let pricing=calcPrice()||{dist:2.5,price:1000};
 let destForFamily=dest||{name:to,lat:pickup.lat+0.02,lng:pickup.lng+0.02};
 map.setView([pickup.lat,pickup.lng],15);
 if(markerPickup)markerPickup.openPopup();
 if(!markerDest){setDest({lat:destForFamily.lat,lng:destForFamily.lng},to);}
 socket.emit('newOrder',{from:pickup,to:to,family:true,familyPhone:phone,vehicle:familyVehicle,pricing:pricing,dest:destForFamily,name:user.name,phone:user.phone,live:true,tracking:true});
 closeFamilyModal();
 alert('✅ تم إرسال طلب لأهلك بنجاح!\\n🚨 إلى: '+to+'\\n📍 من: '+pickup.lat.toFixed(5)+','+pickup.lng.toFixed(5)+' (مثبت)\\n🚗 المركبة: '+familyVehicle.name+'\\n💰 السعر: '+(pricing.price?pricing.price.toLocaleString()+' ر.ي':'...')+'\\n📍 تم تحديد الموقعين على الخريطة - السائق يشاهدكم LIVE');
}

function toggleTracking(){isTracking=!isTracking;let btn=document.getElementById('trackBtn');let btn2=document.getElementById('trackBtn2');if(isTracking){if(btn){btn.innerText='🟢 تتبع ON LIVE';btn.style.background='#022c22';}if(btn2)btn2.innerText='🟢 تتبع LIVE شغال';locateMe();watchGPS();}else{if(btn){btn.innerText='📡 تتبع OFF';btn.style.background='#450a0a';}if(btn2)btn2.innerText='📡 تتبع حقيقي للطرفين';}}
function locateMe(){let fromInput=document.getElementById('from');fromInput.value='⏳ جاري تحديد موقعك بدقة 5م...';if(!navigator.geolocation){fromInput.value='❌ لا يدعم GPS';return;}navigator.geolocation.getCurrentPosition(pos=>{let acc=pos.coords.accuracy;let ll={lat:pos.coords.latitude,lng:pos.coords.longitude};setPickup(ll);document.getElementById('acc').innerText=Math.round(acc)+'م LIVE';fromInput.value='📍 LIVE دقة '+Math.round(acc)+'م: '+ll.lat.toFixed(5)+','+ll.lng.toFixed(5);let dot=document.getElementById('dot');dot.style.background=acc<=10?'#22c55e':acc<=30?'#fbbf24':'#ef4444';watchGPS();document.getElementById('fixBtn').style.display='block';},err=>{fromInput.value='❌ فعل GPS: '+err.message;},{enableHighAccuracy:true,timeout:20000,maximumAge:0});}
function watchGPS(){navigator.geolocation.watchPosition(pos=>{if(markerFixed&&pickup&&pickup.fixed) return;let acc=pos.coords.accuracy;if(acc<=30){let ll={lat:pos.coords.latitude,lng:pos.coords.longitude};if(!markerFixed){pickup={lat:ll.lat,lng:ll.lng,fixed:false};if(markerPickup)markerPickup.setLatLng([ll.lat,ll.lng]);else setPickup(ll);document.getElementById('acc').innerText=Math.round(acc)+'م LIVE';document.getElementById('from').value='📍 LIVE دقة '+Math.round(acc)+'م: '+ll.lat.toFixed(5)+','+ll.lng.toFixed(5);document.getElementById('dot').style.background='#22c55e';if(isTracking){socket.emit('liveLocation',{id:user.phone,lat:ll.lat,lng:ll.lng,role:user.role});}calcPrice();}}},()=>{},{enableHighAccuracy:true,maximumAge:0});}
function order(){if(!pickup){locateMe();alert('حدد موقعك أولا ثم ثبت العلامة');return;}let toVal=document.getElementById('to').value.trim();if(!toVal||toVal.length<2){alert('❌ اكتب إلى أين؟ مثلا: شارع جمال');document.getElementById('to').focus();return;}let pricing=calcPrice();socket.emit('newOrder',{from:pickup,to:toVal,dest:dest,pricing:pricing,vehicle:selectedVehicle,name:user.name,phone:user.phone,email:user.email,live:true,accuracy:5,tracking:isTracking});alert('✅ تم إرسال طلبك\\n🏁 إلى: '+toVal+'\\n🚗 '+selectedVehicle.name+'\\n💰 '+(pricing?pricing.price.toLocaleString()+' ر.ي':'')+'\\n📍 '+(pickup.fixed?'مثبت':'')+' - السائق يشاهدك LIVE');}
function familyOld(){family();}
function startVoice(){if(!navigator.mediaDevices){alert('لا يدعم');return;}navigator.mediaDevices.getUserMedia({audio:true}).then(s=>{let r=new MediaRecorder(s);let c=[];r.ondataavailable=e=>c.push(e.data);r.onstop=()=>{alert('🎤 تم التسجيل - سيرسل مع الطلب');};r.start();alert('🎤 جاري التسجيل...');setTimeout(()=>r.stop(),8000);});}
function startGPS(){if(!navigator.geolocation){alert('لا يدعم');return;}isTracking=true;navigator.geolocation.watchPosition(p=>{socket.emit('driverUpdate',{id:user.phone,lat:p.coords.latitude,lng:p.coords.longitude,name:user.name,accuracy:p.coords.accuracy,live:true});socket.emit('liveLocation',{id:user.phone,lat:p.coords.latitude,lng:p.coords.longitude,name:user.name,role:'driver',live:true});},()=>{},{enableHighAccuracy:true});alert('🟢 تتبع LIVE شغال - ظاهر للركاب');}
socket.on('newOrder',d=>{if(user.role==='driver'){let o=document.getElementById('orders');if(o)o.innerHTML='<div style=background:#022c22;border:2px solid #ef4444;padding:10px;border-radius:10px;margin:6px 0>'+(d.family?'🚨 طلب أهلي<br>':'🚕 طلب<br>')+'👤 '+d.name+'<br>🏁 إلى: '+(d.to||'')+'<br>🚗 '+(d.vehicle?d.vehicle.name:'')+'<br>💰 '+(d.pricing?d.pricing.price.toLocaleString()+' ر.ي':'')+'<br><button onclick=map.setView(['+(d.from?d.from.lat+','+d.from.lng:'13.5795,44.0210')+'],16) style=background:#22c55e;color:#000;border:0;padding:6px 10px;border-radius:6px>📍 عرض</button></div>'+o.innerHTML;if(d.from) map.setView([d.from.lat,d.from.lng],14);}});
setTimeout(locateMe,1000);
<\/script></body></html>`;}
app.get('/',(req,res)=>res.send(HOME));app.get('/mashwari',(req,res)=>res.send(mapHTML('rider')));app.get('/rider',(req,res)=>res.send(mapHTML('rider')));app.get('/driver',(req,res)=>res.send(mapHTML('driver')));io.on('connection',s=>{s.on('newOrder',d=>io.emit('newOrder',d));s.on('driverUpdate',d=>{DRIVERS.set(d.id,d);io.emit('drivers',[...DRIVERS.values()]);io.emit('liveLocation',d);});s.on('liveLocation',d=>{if(d.role==='driver')DRIVERS.set(d.id,d);io.emit('liveLocation',d);});});const PORT=process.env.PORT||3000;server.listen(PORT,()=>console.log('V25 FIXED FAMILY GOV FIX MARKER READY'));
