const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.json());
app.use(express.static('public'));
const YEMEN = {
TAIZ:{lat:13.578,lng:44.021,name:'تعز',code:'TZ'},
SANAA:{lat:15.369,lng:44.191,name:'صنعاء',code:'SA'},
ADEN:{lat:12.779,lng:45.036,name:'عدن',code:'AD'},
HODEIDAH:{lat:14.797,lng:42.954,name:'الحديدة',code:'HD'},
MUKALLA:{lat:14.54,lng:49.124,name:'المكلا',code:'MK'},
IBB:{lat:13.968,lng:44.172,name:'إب',code:'IB'}
};
const cars=new Map();
app.get('/health',(req,res)=>res.json({country:'YEMEN اليمن',cities:6,liveCars:cars.size,servers:4,status:'alive'}));
app.get('/yemen/cities',(req,res)=>res.json(YEMEN));
app.post('/yemen/nearest',(req,res)=>res.json({total:cars.size,nearest:[...cars.values()].slice(0,5)}));
app.get('/yemen/cars',(req,res)=>res.json([...cars.values()]));
io.on('connection',(socket)=>{
socket.on('yemen:car:location',(d)=>{
const car={...d,lastUpdate:Date.now(),cityName:YEMEN[d.city]?.name||d.city};
cars.set(d.driverId,car);
io.emit('yemen:all:cars',[...cars.values()]);
io.to('track:'+d.driverId).emit('yemen:car:live',car);
});
});
app.get('/',(req,res)=>res.send(`<h1>🇾🇪 اطلبني اليمن</h1><p>${Object.values(YEMEN).map(c=>c.name).join(' - ')}</p><p>سيارات: ${cars.size}</p>`));
const PORT=process.env.PORT||8000;
server.listen(PORT,()=>console.log('YEMEN '+PORT));
