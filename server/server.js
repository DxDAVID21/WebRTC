const express = require('express');
const {Server} = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

app.use(express.static(path.join(__dirname, '..', 'client')));

const users = new Map();

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);  

  socket.on('user-joined', (name) => {
    const user ={ id: socket.id, name: name };
    
    users.set(socket.id, user);

    io.emit('user-joined', user);

    io.emit('user-list', Array.from(users.values()));
    
    console.log(`User joined: ${name} (ID: ${socket.id})`);
  });
  
  socket.on('disconnect', () => {
    const leavingUser = users.get(socket.id);
    if (leavingUser) {
      users.delete(socket.id);
      io.emit('user-left', socket.id);
      console.log(`User left: ${leavingUser.name} (ID: ${socket.id})`);
    } else {
      console.log(`Unknown user disconnected (ID: ${socket.id})`);
    }
  });

  socket.on('signal', data => {
    io.to(data.target).emit('signal', {
      from: data.from,
      signal: data.signal
    });
  });
  
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});



server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});