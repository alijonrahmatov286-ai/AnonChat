const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const users = new Map();
const pairs = new Map();
const waitingUsers = [];

io.on('connection', (socket) => {
  io.emit('users-online', users.size);

  socket.on('register-user', (data) => {
    users.set(socket.id, { id: socket.id, ...data, status: 'searching' });
    io.emit('users-online', users.size);
  });

  socket.on('find-user', () => {
    const user = users.get(socket.id);
    if (!user) return;
    if (!waitingUsers.find(u => u.id === socket.id)) waitingUsers.push(user);
    
    const matches = waitingUsers.filter(u => u.id !== socket.id && (user.seeking.gender === u.gender || user.seeking.gender === 'any'));
    if (matches.length > 0) {
      const match = matches[Math.floor(Math.random() * matches.length)];
      pairs.set(socket.id, match.id);
      pairs.set(match.id, socket.id);
      waitingUsers.splice(waitingUsers.findIndex(u => u.id === socket.id), 1);
      waitingUsers.splice(waitingUsers.findIndex(u => u.id === match.id), 1);
      io.to(socket.id).emit('user-matched', { gender: match.gender, age: match.age });
      io.to(match.id).emit('user-matched', { gender: user.gender, age: user.age });
    }
  });

  socket.on('send-message', (msg) => {
    const partnerId = pairs.get(socket.id);
    if (partnerId) io.to(partnerId).emit('receive-message', { message: msg });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('users-online', users.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));