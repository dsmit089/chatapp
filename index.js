const express = require('express');
const bodyParser = require('body-parser');
const {Server} = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(bodyParser.json());
app.use(express.static('public'));

const emailToScoketMapping = new Map();
const socketToEmailMapping = new Map();

io.on('connection', (socket) => {
    
    socket.on('join-room',data =>{
        const {roomId, emailId} = data;
        emailToScoketMapping.set(emailId,roomId);
        socketToEmailMapping.set(socket.id,emailId);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-joined',{emailId});
    });

    socket.on('call-user',data =>{
        const {emailId,offer} = data;
        console.log(emailId,offer);
        const fromEmail = socketToEmailMapping.get(socket.id);
        const socketId = emailToScoketMapping.get(emailId);
        socket.to(socketId).emit('incomming-call',{ from: fromEmail , offer});
    });

    socket.on('call-accepted',data =>{
        const {emailId,ans} = data;
        const socketId = emailToScoketMapping.get(emailId);
        socket.to(socketId).emit('call-accepted',{ans});
    });

});

app.use(bodyParser.json());

server.listen(8000);