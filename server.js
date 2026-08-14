const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.json());
app.use(express.static('public'));
const YEMEN = {
  TAIZ:{lat:13.5795,lng:44.0209},
  SANAA:{lat:15.3694,lng:44.1910},
  ADEN:{lat:12.7797,lng:45.0367},
  HODEIDAH:{lat:14.7961,lng:42.9545},
  MUKALLA:{lat:14.5425,lng:49.1242},
  IBB:{lat:13.9660,lng:44.2050}
};
let cars=new Map();
app.get('/health',(req,res)=>{res.json({country:"YEMEN",cities:6,liveCars:cars.size,servers:4,status:"alive",edge:"KOYEB EDGE WORKING"})});
app.get('/yemen',(req,res)=>{res.json(YEMEN)});
app.get('/',(req,res)=>{res.sendFile(__dirname+'/public/index.html')});
io.on('connection',s=>{s.on('updateLocation',d=>{cars.set(d.id,d);io.emit('cars',Array.from(cars.values()))})});
const PORT=process.env.PORT||8000;
server.listen(PORT,'0.0.0.0',()=>console.log('Live '+PORT));