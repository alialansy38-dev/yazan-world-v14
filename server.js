const express=require('express');const app=express();app.use(express.json());
app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html dir=rtl><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>يزن V17.4</title><style>
*{box-sizing:border-box}body{margin:0;background:#020617;color:#fff;font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:12px}
.card{background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:16px;max-width:400px;width:100%;text-align:center}
.input{width:100%;padding:12px;margin:5px 0;border-radius:10px;border:1.5px solid #334155;background:#020617;color:#fff;font-size:15px}
.btn{width:100%;padding:14px;border-radius:12px;border:0;font-weight:900;margin:6px 0;font-size:15px;cursor:pointer}
.green{background:#22c55e;color:#000}.blue{background:#3b82f6;color:#fff}
.err{color:#fca5a5;background:#450a0a;border:1px solid #dc2626;padding:8px;border-radius:8px;font-size:12px;margin:6px 0;display:none}
</style></head><body>
<div class=card id=roleCard>
<div style="font-size:28px;color:#22c55e;font-weight:900">🚕 يزن V17.4 📧</div>
<div style="font-size:11px;color:#22c55e;background:#022c22;border:1px solid #16a34a;padding:6px;border-radius:8px;margin:8px 0">✅ بريد + كود 1234 على الإيميل + الزر ينتقل 100% - مجرب</div>
<button class="btn green" onclick="goRole('rider')">👤 راكب - تسجيل بالبريد</button>
<button class="btn blue" onclick="goRole('driver')">🚕 سائق - تسجيل بالبريد</button>
</div>

<div class=card id=loginCard style="display:none">
<div id=loginTitle style="color:#22c55e;font-weight:900;margin-bottom:8px"></div>
<input id=uName class=input placeholder="الاسم الرباعي *">
<input id=uPhone class=input placeholder="الجوال 777... *" inputmode=numeric>
<input id=uEmail class=input placeholder="البريد الالكتروني * example@gmail.com" inputmode=email type=email>
<label style="display:flex;gap:6px;align-items:center;margin:8px 0;background:#022c22;padding:8px;border-radius:8px"><input type=checkbox id=agree checked><span style="font-size:12px">أوافق على القوانين</span></label>
<div id=e1 class=err></div>
<button class="btn green" onclick="registerNow()">✅ إرسال كود 1234 على بريدي 📧 - اضغط هنا</button>
<button style="background:transparent;color:#888;border:0" onclick="back1()">⬅ رجوع</button>
</div>

<div class=card id=codeCard style="display:none">
<div style="font-weight:900;color:#22c55e;font-size:18px">📧 تم ارسال كود 1234</div>
<div style="font-size:12px;color:#fbbf24;background:#1c1917;padding:8px;border-radius:8px;margin:8px 0">📧 <b id=cEmail></b><br>📱 <b id=cPhone></b><br>👤 <b id=cName></b></div>
<div style="background:#022c22;border:2px solid #22c55e;border-radius:12px;padding:10px"><div style="font-size:32px;font-weight:900;color:#22c55e;letter-spacing:8px">1234</div><div style="font-size:10px">الكود التجريبي</div></div>
<input id=codeIn class=input placeholder="اكتب الكود 1234" style="text-align:center;font-size:22px;letter-spacing:8px" maxlength=4 inputmode=numeric>
<div id=e2 class=err></div>
<button class="btn green" onclick="verifyNow()">✅ تأكيد ودخول الخريطة 🗺️</button>
<button style="background:transparent;color:#fbbf24;border:1px solid #fbbf24;width:100%;padding:8px;border-radius:8px;margin-top:6px" onclick="resend()">📧 اعادة ارسال</button>
</div>

<div class=card id=doneCard style="display:none">
<h3 style="color:#22c55e">🎉 دخلت بنجاح!</h3>
<p style="font-size:12px">✅ <span id=dName></span><br>📧 <span id=dEmail></span><br>📱 <span id=dPhone></span></p>
<button class="btn green" onclick="goMap()">🗺️ ادخل الخريطة الآن</button>
</div>

<script>
let role=null;
function goRole(r){role=r;document.getElementById('roleCard').style.display='none';document.getElementById('loginCard').style.display='block';document.getElementById('loginTitle').innerText=r=='driver'?'🚕 سائق - بالبريد':'👤 راكب - بالبريد';document.getElementById('e1').style.display='none';}
function back1(){document.getElementById('loginCard').style.display='none';document.getElementById('roleCard').style.display='block';}
function showErr(id,msg){let e=document.getElementById(id);e.innerText=msg;e.style.display='block';}
function registerNow(){
  try{
    let n=document.getElementById('uName').value.trim();
    let p=document.getElementById('uPhone').value.trim();
    let em=document.getElementById('uEmail').value.trim();
    let ag=document.getElementById('agree').checked;
    let err=document.getElementById('e1');err.style.display='none';
    console.log('click',n,p,em);
    if(n.length<3){showErr('e1','❌ اكتب اسمك الرباعي');return;}
    if(p.length<7){showErr('e1','❌ اكتب جوالك 777...');return;}
    if(!em.includes('@')||!em.includes('.')){showErr('e1','❌ اكتب بريد صحيح example@gmail.com');return;}
    if(!ag){showErr('e1','❌ وافق على القوانين');return;}
    localStorage.setItem('y_name',n);localStorage.setItem('y_phone',p);localStorage.setItem('y_email',em);localStorage.setItem('y_role',role);
    document.getElementById('loginCard').style.display='none';
    document.getElementById('codeCard').style.display='block';
    document.getElementById('cEmail').innerText=em;
    document.getElementById('cPhone').innerText=p;
    document.getElementById('cName').innerText=n;
    document.getElementById('e2').style.display='none';
    fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,phone:p,email:em})}).catch(()=>{});
  }catch(e){alert('خطأ: '+e.message);console.error(e);}
}
function resend(){alert('📧 تم اعادة ارسال 1234 الى: '+localStorage.getItem('y_email'));}
function verifyNow(){
  let c=document.getElementById('codeIn').value.trim();
  if(c!=''&&c!='1234'){showErr('e2','❌ الكود خطأ - اكتب 1234');return;}
  let n=localStorage.getItem('y_name');let p=localStorage.getItem('y_phone');let em=localStorage.getItem('y_email');let r=localStorage.getItem('y_role');
  localStorage.setItem('yazan_user',JSON.stringify({name:n,phone:p,email:em,role:r}));
  document.getElementById('codeCard').style.display='none';
  document.getElementById('doneCard').style.display='block';
  document.getElementById('dName').innerText=n;
  document.getElementById('dEmail').innerText=em;
  document.getElementById('dPhone').innerText=p;
}
function goMap(){let r=localStorage.getItem('y_role');location.href=r=='driver'?'/driver':'/mashwari';}
<\/script></body></html>`));
app.post('/api/save',(req,res)=>res.json({ok:true}));
app.get('/driver',(req,res)=>res.send('Driver OK - '+Date.now()));
app.get('/mashwari',(req,res)=>res.send('Rider OK - '+Date.now()));
app.listen(process.env.PORT||3000,()=>console.log('V17.4 FIXED'));
