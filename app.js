const express = require('express');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// const options = {
//     key: fs.readFileSync(path.join(__dirname, './server.key')),
//     cert: fs.readFileSync(path.join(__dirname, './server.cert'))
//   };

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(bodyParser.json());
app.use(express.static('public'));

const allusers = new Map();

app.use(express.static(path.join(__dirname, 'public')));

app.use("/", function(req, res){
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    socket.on('join-user', data => {
        console.log('User joined: ', data,socket.id);
        const { username } = data;
        allusers[username] = { username, id: socket.id };
        io.emit('user-joined', allusers);
    });

    socket.on("offer", ({ from, to, offer }) => {
        console.log("offer", { from, to, offer });
        io.to(allusers[to.username].id).emit("offer", { from : allusers[from] , to, offer });
    });

    socket.on("answer", ({ from, to, answer }) => {
        console.log("answer", { from, to, answer });
        io.to(allusers[from].id).emit("answer", { from, to, answer });
    });

    socket.on("end-call", ({ from, to }) => {
        io.to(allusers[to].id).emit("end-call", { from, to });
    });

    socket.on("call-ended", caller => {
        const [from, to] = caller;
        io.to(allusers[from].id).emit("call-ended", caller);
        io.to(allusers[to].id).emit("call-ended", caller);
    })

    socket.on('disconnect', (reason) => {
        //console.log(`User disconnected:`,allusers);
    });

    socket.on("icecandidate", candidate => {
        socket.broadcast.emit("icecandidate", candidate);
    });
});

app.use(bodyParser.json());

server.listen(8000);