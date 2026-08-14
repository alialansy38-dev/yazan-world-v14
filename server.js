const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"}});
app.use(express.static('public'));
app.use(express.json());
const YEMEN={TAIZ:{lat:13.5795,lng:44.021},SANAA:{lat:15.3694,lng:44.191},ADEN:{lat:12.8,lng:45.03},HODEIDAH:{lat:14.8,lng:42.95},MUKALLA:{lat:14.5,lng:49.1},IBB:{lat:13.97,lng:44.18}};
let cars=new Map();
app.get('/',(req,res)=>res.sendFile(__dirname+'/public/index.html'));
app.get('/health',(req,res)=>res.json({country:'YEMEN',cities:6,cars:cars.size,status:'alive'}));
app.get('/yemen',(req,res)=>res.json(YEMEN));
io.on('connection',socket=>{
 socket.on('update',d=>{cars.set(socket.id,d);io.emit('cars',Array.from(cars.values()))});
 socket.on('disconnect',()=>{cars.delete(socket.id);io.emit('cars',Array.from(cars.values()))});
});
const PORT=process.env.PORT||8000;
server.listen(PORT,'0.0.0.0',()=>console.log('Live Yemen on '+PORT));
