const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"}});
app.use(express.static('public'));
app.use(express.json());
const YEMEN={TAIZ:{lat:13.5795,lng:44.021},SANAA:{lat:15.3694,lng:44.191},ADEN:{lat:12.7797,lng:45.036},HADHRAMAUT:{lat:14.543,lng:49.1273}};
let cars=new Map();
app.get('/',(req,res)=>res.sendFile(__dirname+'/public/index.html'));
app.get('/health',(req,res)=>res.json({status:'alive',servers:24,empire:'Yazan',time:new Date()}));
app.get('/ping',(req,res)=>res.send('pong - Yazan Empire 24 Live'));
app.get('/yemen',(req,res)=>res.json(YEMEN));
io.on('connection',socket=>{
 socket.on('update',d=>{cars.set(socket.id,d);io.emit('cars',[...cars.values()])});
 socket.on('disconnect',()=>{cars.delete(socket.id);io.emit('cars',[...cars.values()])});
});
const PORT=process.env.PORT||8000;
server.listen(PORT,'0.0.0.0',()=>console.log(`🛡️ جيش يزن 24 LIVE على ${PORT}`));

// ===== نظام منع النوم - يصحي الـ 24 سيرفر =====
const SERVERS=[
"https://yazan-world-v14-taiz.onrender.com",
"https://yazan-world-v14-sanaa.onrender.com",
"https://yazan-world-v14-aden.onrender.com",
"https://yazan-world-v14-hadhramaut.onrender.com",
"https://yazan-world-v14-ib.onrender.com",
"https://yazan-world-v14-dhamar.onrender.com",
"https://yazan-world-v14-al-hudaydah.onrender.com",
"https://yazan-world-v14-hajjah.onrender.com",
"https://yazan-world-v14-saada.onrender.com",
"https://yazan-world-v14-amran.onrender.com",
"https://yazan-world-v14-al-jawf.onrender.com",
"https://yazan-world-v14-marib.onrender.com",
"https://yazan-world-v14-al-bayda.onrender.com",
"https://yazan-world-v14-shabwah.onrender.com",
"https://yazan-world-v14-al-mahrah.onrender.com",
"https://yazan-world-v14-socotra.onrender.com",
"https://yazan-world-v14-abyan.onrender.com",
"https://yazan-world-v14-lahj.onrender.com",
"https://yazan-world-v14-al-dhale.onrender.com",
"https://yazan-world-v14-raimah.onrender.com",
"https://yazan-world-v14-al-mahwit.onrender.com",
"https://yazan-world-v14-rdfan.onrender.com",
"https://yazan-world-v14-1.onrender.com",
"https://yazan-world-v14-2.onrender.com"
];
setInterval(async()=>{
 console.log("⏰ تصحية جيش 24...");
 for(const url of SERVERS){ try{ await fetch(url+"/ping"); }catch{} }
},240000);
