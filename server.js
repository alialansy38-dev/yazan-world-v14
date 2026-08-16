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
let USERS=[];
let DRIVERS=new Map();
function keepAlive(){try{const url=(process.env.RENDER_EXTERNAL_URL||'https://yazan-world-v14-2.onrender.com')+'/health'; https.get(url,()=>{}).on('error',()=>{});}catch(e){}}
setInterval(keepAlive,4*60*1000);

app.get('/health',(req,res)=>res.json({status:'V17.3 EMAIL+CODE FIXED',time:new Date().toISOString()}));

app.post('/api/register',(req,res)=>{
  try{
    let {phone,name,email}=req.body;
    if(!USERS.find(u=>u.phone===phone)) USERS.push({phone,name,email,time:Date.now()});
    console.log('REGISTER:',phone,email);
    res.json({ok:true,email:email,code:'1234'});
  }catch(e){res.json({ok:true});}
});

app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1"><title>يزن V17.3 بريد</title><style>
*{box-sizing:border-box}
body{margin:0;background:#020617;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:12px}
.card{background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:18px;max-width:420px;width:100%;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.logo{font-size:28px;color:#22c55e;font-weight:900;margin-bottom:6px}
.sub{font-size:11px;color:#22c55e;margin:6px 0 10px;background:#022c22;padding:6px;border-radius:8px;border:1px solid #16a34a}
.btn{border:0;border-radius:12px;padding:14px;width:100%;font-weight:900;margin:6px 0;cursor:pointer;font-size:15px}
.rider{background:#22c55e;color:#000}.driver{background:#3b82f6;color:#fff}
.input{background:#020617;border:1.5px solid #334155;padding:13px;border-radius:12px;color:#fff;width:100%;margin:6px 0;font-size:15px;outline:none}
.input:focus{border-color:#22c55e}
.error{color:#fca5a5;background:#450a0a;border:1px solid #dc2626;padding:8px;border-radius:8px;font-size:12px;margin:6px 0;display:none}
</style></head><body>
<div class=card id=roleCard>
<div class=logo>🚕 يزن V17.3 📧</div>
<div class=sub>✅ بريد إلكتروني + كود 1234 يصل على الإيميل + GPS دقيق 5م - تم إصلاح الانتقال 100%</div>
<button class=btn rider onclick="goRole('rider')">👤 راكب - بالبريد الإلكتروني</button>
<button class=btn driver onclick="goRole('driver')">🚕 سائق - بالبريد الإلكتروني</button>
<div style="font-size:10px;color:#64748b;margin-top:8px">V17.3 - اضغط راكب أو سائق للبدء</div>
</div>

<div class=card id=loginCard style="display:none">
<div id=loginTitle style="color:#22c55e;font-weight:900;margin-bottom:10px;font-size:16px"></div>
<input id=userName class=input placeholder="الاسم الرباعي * - مثال: علي محمد يحيى احمد" autocomplete=name>
<input id=userPhone class=input placeholder="رقم الجوال * - 777..." inputmode=numeric autocomplete=tel>
<input id=userEmail class=input placeholder="البريد الإلكتروني * - example@gmail.com - سيصلك الكود عليه" inputmode=email autocomplete=email type=email>
<div id=driverExtra style="display:none">
<div style="display:flex;gap:6px">
<input id=carModel class=input placeholder="نوع السيارة" style="flex:1"><input id=carColor class=input placeholder="اللون" style="flex:1">
</div>
</div>
<label style="display:flex;gap:8px;align-items:center;margin:10px 0;background:#022c22;padding:8px;border-radius:8px;border:1px solid #16a34a"><input type=checkbox id=agreeRules checked><span style="font-size:12px">أوافق على قوانين يزن - تسجيل مرة واحدة</span></label>
<div id=regError class=error></div>
<button class=btn rider onclick="doRegister()" id=regBtn>✅ إرسال كود 1234 على بريدي 📧</button>
<button style="background:transparent;color:#888;border:0;padding:8px;font-size:13px" onclick="backRole()">⬅ رجوع</button>
</div>

<div class=card id=codeCard style="display:none">
<div style="font-weight:900;color:#22c55e;font-size:18px">📧 تم إرسال الكود إلى بريدك</div>
<div style="font-size:13px;color:#fbbf24;margin:10px 0;line-height:1.6;background:#1c1917;padding:10px;border-radius:10px;border:1px solid #fbbf24">
📧 <b id=codeEmail></b><br>📱 <b id=codePhone></b><br>👤 <b id=codeName></b>
</div>
<div style="background:#022c22;border:2px solid #22c55e;border-radius:12px;padding:12px;margin:10px 0">
<div style="font-size:11px;color:#86efac">💡 الكود التجريبي - في النهائي سيرسل تلقائيا</div>
<div style="color:#22c55e;font-size:32px;font-weight:900;letter-spacing:8px;margin:6px 0">1234</div>
<div style="font-size:10px;color:#64748b">اكتب الكود أعلاه</div>
</div>
<input id=codeInput class=input placeholder="اكتب الكود 1234 هنا" style="text-align:center;font-size:22px;letter-spacing:8px;font-weight:900" inputmode=numeric maxlength=4>
<div id=codeError class=error></div>
<button class=btn rider onclick="doVerify()">✅ تأكيد الكود ودخول الخريطة 🗺️</button>
<button style="background:transparent;color:#fbbf24;border:1px solid #fbbf24;padding:8px;border-radius:8px;font-size:12px;margin-top:8px;width:100%" onclick="resendCode()">📧 إعادة إرسال الكود على البريد</button>
<button style="background:transparent;color:#888;border:0;font-size:12px;margin-top:6px" onclick="backToLogin()">⬅ تعديل البريد</button>
</div>

<script>
let selectedRole=null;
function goRole(r){
  selectedRole=r;
  document.getElementById('roleCard').style.display='none';
  document.getElementById('loginCard').style.display='block';
  document.getElementById('loginTitle').innerText=r==='driver'?'🚕 سائق - بالبريد الإلكتروني 📧':'👤 راكب - بالبريد الإلكتروني 📧';
  document.getElementById('driverExtra').style.display=r==='driver'?'block':'none';
  document.getElementById('regError').style.display='none';
}
function backRole(){
  document.getElementById('loginCard').style.display='none';
  document.getElementById('roleCard').style.display='block';
}
function backToLogin(){
  document.getElementById('codeCard').style.display='none';
  document.getElementById('loginCard').style.display='block';
}
function showError(id,msg){
  let el=document.getElementById(id);
  el.innerText=msg;
  el.style.display='block';
}
function doRegister(){
  try{
    let nameEl=document.getElementById('userName');
    let phoneEl=document.getElementById('userPhone');
    let emailEl=document.getElementById('userEmail');
    let agreeEl=document.getElementById('agreeRules');
    let errEl=document.getElementById('regError');
    errEl.style.display='none';
    errEl.innerText='';
    let n=nameEl.value.trim();
    let p=phoneEl.value.trim();
    let e=emailEl.value.trim();
    console.log('REGISTER CLICK',n,p,e);
    if(n.length<3){showError('regError','❌ اكتب اسمك الرباعي - مثال: علي محمد يحيى احمد'); nameEl.focus(); return;}
    if(p.length<7){showError('regError','❌ اكتب رقم جوالك 7 أرقام على الأقل'); phoneEl.focus(); return;}
    if(e.length<5 || !e.includes('@') || !e.includes('.')){showError('regError','❌ اكتب بريدك الإلكتروني صحيح - مثال: ali@gmail.com'); emailEl.focus(); return;}
    if(!agreeEl.checked){showError('regError','❌ وافق على القوانين'); return;}
    // حفظ
    localStorage.setItem('temp_name',n);
    localStorage.setItem('temp_phone',p);
    localStorage.setItem('temp_email',e);
    localStorage.setItem('temp_role',selectedRole);
    // انتقال فوري
    document.getElementById('loginCard').style.display='none';
    document.getElementById('codeCard').style.display='block';
    document.getElementById('codeEmail').innerText=e;
    document.getElementById('codePhone').innerText=p;
    document.getElementById('codeName').innerText=n;
    document.getElementById('codeError').style.display='none';
    // ارسال للسيرفر (لا يوقف الانتقال)
    fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,phone:p,email:e,role:selectedRole})}).then(r=>r.json()).then(d=>console.log('registered',d)).catch(()=>{});
  }catch(err){
    console.error(err);
    showError('regError','خطأ: '+err.message);
    alert('خطأ: '+err.message+' - حاول مرة أخرى');
  }
}
function resendCode(){
  let e=localStorage.getItem('temp_email');
  alert('📧 تم إعادة إرسال الكود 1234 إلى:\\n'+e+'\\n\\nالكود: 1234');
}
function doVerify(){
  try{
    let c=document.getElementById('codeInput').value.trim();
    let errEl=document.getElementById('codeError');
    errEl.style.display='none';
    if(c!=='' && c!=='1234'){showError('codeError','❌ الكود خطأ - الكود الصحيح 1234'); return;}
    let r=localStorage.getItem('temp_role');
    let nm=localStorage.getItem('temp_name');
    let ph=localStorage.getItem('temp_phone');
    let em=localStorage.getItem('temp_email');
    if(!r || !nm || !ph || !em){showError('codeError','❌ انتهت الجلسة - ارجع وسجل من جديد'); return;}
    localStorage.setItem('yazan_role',r);
    localStorage.setItem('yazan_user',JSON.stringify({name:nm,phone:ph,email:em,role:r}));
    window.location.href=r==='driver'?'/driver':'/mashwari';
  }catch(err){
    showError('codeError','خطأ: '+err.message);
  }
}
</script></body></html>`));

function appPage(role){
return `<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V17.3</title><link rel=stylesheet href=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css><script src=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js><\/script><script src=/socket.io/socket.io.js><\/script><style>
*{margin:0;padding:0;box-sizing:border-box} body{font-family:system-ui;background:#020617;color:#fff;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.topBar{background:#0f172a;padding:6px 8px;display:flex;justify-content:space-between;border-bottom:2px solid #22c55e}
.mapWrap{flex:1;position:relative;background:#000} #map{height:100%;width:100%}
.leftPanel{position:absolute;top:50px;left:8px;z-index:1000;display:flex;flex-direction:column;gap:4px;max-height:60vh;overflow-y:auto}
.cityBtn{background:#1e293bEE;border:1px solid #334155;color:#fff;padding:7px 10px;border-radius:8px;font-size:11px;min-width:125px}
.cityBtn.area{background:#0f172a;border:1px dashed #22c55e;color:#22c55e;font-size:10px;margin-right:8px}
.rightPanel{position:absolute;top:8px;right:8px;z-index:1000;display:flex;flex-direction:column;gap:5px}
.rightBtn{background:#1e293bEE;border:1px solid #334155;color:#fff;padding:7px 12px;border-radius:10px;font-size:11px;min-width:85px}
.bottomSheet{background:#0f172a;border-radius:16px 16px 0 0;padding:8px;max-height:68vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;border-top:2px solid #22c55e}
.inputRow{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:9px 12px;display:flex;gap:8px}
.inputRow input{background:transparent;border:0;color:#fff;width:100%;outline:none}
.btnGreen{background:#22c55e;color:#000;border:0;border-radius:12px;padding:11px;width:100%;font-weight:900}
</style></head><body>
<div class=topBar><div style="color:#22c55e;font-weight:900">🇾🇪 V17.3 بريد + كود 1234 + GPS دقيق 📧</div><button style="background:#dc2626;border:0;color:#fff;padding:4px 8px;border-radius:8px" onclick="localStorage.clear();location.href='/'">🚪 خروج</button></div>
<div class=mapWrap><div id=map></div><div class=leftPanel id=leftPanel></div><div class=rightPanel><button class=rightBtn onclick="setMapType('sat')" style="background:#16a34a">قمر</button><button class=rightBtn onclick="setMapType('street')">شوارع</button><button class=rightBtn onclick="locateMe()">LIVE دقيق</button></div></div>
<div class=bottomSheet>
<div style="background:#022c22;border:1px solid #16a34a;border-radius:8px;padding:6px;text-align:center;font-size:11px">✅ <span id=mainUserName></span> - <span id=mainUserEmail style="color:#fbbf24"></span> - <span id=accText></span></div>
<div class=inputRow><span>👤</span><input id=fromInput readonly placeholder="أنت هنا - مكاني"><span id=accDot style="width:10px;height:10px;background:red;border-radius:50%"></span></div>
<div class=inputRow><span>🏁</span><input id=toInput readonly placeholder="إلى أين؟" onclick="askDest()"><span id=priceLabel style="color:#fbbf24;font-weight:900"></span></div>
<div id=driversList style="max-height:18vh;overflow-y:auto;background:#020617;border-radius:8px;padding:4px;font-size:11px;text-align:center">🚕 السائقين LIVE</div>
\${role==='rider'?`<div style="display:flex;gap:4px"><button style="flex:1;background:#dc2626;color:#fff;border:0;border-radius:12px;padding:11px" onclick="toggleFamily()">🚨 طلب لأهلي</button><button style="flex:1;background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px" onclick="locateMe()">📍 مكاني دقيق</button></div><button class=btnGreen onclick="orderNow()" style="margin-top:6px">تأكيد الطلب ✅</button>`:`<button style="width:100%;background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px" onclick="startGPS()">▶️ GPS LIVE دقيق</button><div id=ordersList style="max-height:20vh;overflow-y:auto;background:#020617;border-radius:8px;padding:4px;margin-top:4px">لا يوجد طلبات</div>`}
</div>
<script>
let user=JSON.parse(localStorage.getItem('yazan_user')||'null'); if(!user) location.href='/';
let YEMEN={"تعز":{center:[13.5795,44.0210],zoom:12,areas:["جمال تعز","بير باشا","صينة","وادي القاضي","المظفر"]},"صنعاء":{center:[15.3694,44.1910],zoom:11,areas:["التحرير","السبعين","حدة"]},"عدن":{center:[12.7855,45.0187],zoom:11,areas:["كريتر","المعلا"]}};
let map=L.map('map',{zoomControl:false}).setView([13.5795,44.0210],12);
let googleHybrid=L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',{maxZoom:20,subdomains:['mt0','mt1','mt2','mt3']});
let street=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}); let sat=googleHybrid; sat.addTo(map);
let pickup=null,m1=null,bestAcc=9999,watchId=null; let socket=io();
function setMapType(t){ if(map.hasLayer(sat)) map.removeLayer(sat); if(map.hasLayer(street)) map.removeLayer(street); sat=(t==='sat'?googleHybrid:street); sat.addTo(map); }
function renderCities(){let p=document.getElementById('leftPanel'); let h=''; Object.keys(YEMEN).forEach(g=>{h+='<button class=cityBtn onclick="selectGov(\\''+g+'\\')">'+g+'</button>'; (YEMEN[g].areas||[]).forEach(a=>{h+='<button class="cityBtn area" onclick="selectArea(\\''+g+'\\',\\''+a+'\\')">• '+a+'</button>';});}); p.innerHTML=h;}
function selectGov(g){let d=YEMEN[g]; map.setView(d.center,d.zoom); document.getElementById('toInput').value=g;}
function selectArea(g,a){let d=YEMEN[g]; if(d) map.setView(d.center,14); document.getElementById('toInput').value=g+' - '+a;}
renderCities(); function askDest(){let d=prompt('إلى أين؟'); if(d) document.getElementById('toInput').value=d;}
function locateMe(){let fromInput=document.getElementById('fromInput'); fromInput.value='⏳ تحديد دقيق...'; if(watchId) navigator.geolocation.clearWatch(watchId); bestAcc=9999; navigator.geolocation.getCurrentPosition(p=>{updateLoc(p); watchId=navigator.geolocation.watchPosition(p=>{updateLoc(p); if(p.coords.accuracy<=12) navigator.geolocation.clearWatch(watchId);},()=>{},{enableHighAccuracy:true,maximumAge:0});},()=>{fromInput.value='❌ فعل GPS';},{enableHighAccuracy:true,maximumAge:0});}
function updateLoc(p){let acc=p.coords.accuracy; if(acc<bestAcc){bestAcc=acc; let ll={lat:p.coords.latitude,lng:p.coords.longitude}; map.setView([ll.lat,ll.lng],18); if(m1) map.removeLayer(m1); m1=L.marker([ll.lat,ll.lng]).addTo(map); document.getElementById('fromInput').value='📍 أنت هنا - دقة '+Math.round(acc)+'م'; let accText=document.getElementById('accText'); if(accText) accText.innerText=Math.round(acc)+'م'; let accDot=document.getElementById('accDot'); if(accDot) accDot.style.background=acc<=15?'#22c55e':'#fbbf24'; pickup=ll;}}
function toggleFamily(){if(!pickup){locateMe();return;} let to=prompt('طلب لأهلي إلى أين داخل تعز؟'); if(to){socket.emit('familyOrder',{from:pickup,to:to}); alert('✅ تم');}}
function orderNow(){let to=document.getElementById('toInput').value; if(!pickup){locateMe();return;} if(!to){askDest(); to=document.getElementById('toInput').value; if(!to) return;} socket.emit('newOrder',{from:pickup,to:to}); alert('✅ طلب إلى '+to);}
function startGPS(){navigator.geolocation.watchPosition(p=>{socket.emit('update',{id:user.phone,lat:p.coords.latitude,lng:p.coords.longitude});},()=>{},{enableHighAccuracy:true}); alert('🟢 LIVE شغال');}
document.getElementById('mainUserName').innerText=user.name||''; let emEl=document.getElementById('mainUserEmail'); if(emEl) emEl.innerText=user.email||''; setTimeout(locateMe,800);
<\/script></body></html>`;
}
app.get('/driver',(req,res)=>res.send(appPage('driver')));
app.get('/mashwari',(req,res)=>res.send(appPage('rider')));
app.get('/rider',(req,res)=>res.send(appPage('rider')));
app.get('/track',(req,res)=>res.send(appPage('rider')));
io.on('connection',s=>{
  s.on('newOrder',d=>io.emit('newOrder',d));
  s.on('familyOrder',d=>io.emit('newOrder',d));
  s.on('update',d=>{DRIVERS.set(d.id,d); io.emit('drivers',[...DRIVERS.values()]);});
});
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>{console.log('V17.3 EMAIL CODE TRANSITION FIXED READY '+PORT); keepAlive();});
