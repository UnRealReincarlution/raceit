const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path')

app.use(express.static(path.join(__dirname, 'public')));

rooms = [];
connections = [];
connection_index = [];

io.on('connection', (socket) => {
  console.log(`+++++: ${socket.id} Connected`);
  socket.username = "deafult";

  connections.push(socket);
  connection_index.push(socket.id);

  socket.on('disconnect', function() {
    console.log(`-----: ${socket.id} Disconnected`);
  });

  socket.on('echo', (data) => {
    socket.to(data.room).emit('echo', {
      message: data.data
    });

    console.log('Echoing', data.data);
  });

  socket.on('create', (room, your_name) => {
    socket.join(room);

    console.log(`Creating and Joining Room: ${room}`);
    rooms.push(room);

    connections[connections.indexOf(socket)].host = true;
    socket.host = true;

    //console.log(rooms);
    //console.log(io.nsps['/'].adapter.rooms);
  });

  socket.on('join', (room, name) => {
    if (rooms.includes(room)) {
      socket.join(room);
    }

    connections[connections.indexOf(socket)].host = false;
    socket.host = false;
  });

  socket.on('getRooms', () => {
    socket.emit('rooms', {
      message: rooms
    });

    console.log("Get Rooms Request Recieved and Replied to");
    //console.log(rooms);
  });

  socket.on('setUsername', (username) => {
    connections[connections.indexOf(socket)].username = username;
    socket.username = username;

    console.log(`Username set! - ${username}`);
  });

  socket.on('getRoomMembers', (room_name) => {
    console.log("Get Room Members Request Recieved and Replied to");
    sockets = [];

    for (socketID in io.nsps['/'].adapter.rooms[room_name].sockets) {
      sockets.push({name: connections[connection_index.indexOf(socketID)].username, id: socketID});
    }

    io.in(room_name).emit('postRoomMembers', {
      message: sockets
    });

    //console.log(sockets);
  });

  function getAvaliableRooms() {
    var roomKeys = Object.keys(socket.rooms);
    var socketIdIndex = roomKeys.indexOf(socket.id);
    console.log(socketIdIndex, " ", socket.id);
    var rooms = roomKeys.splice(socketIdIndex, 1);
    return rooms;
  }
});

server.listen(3000, function() {
  console.log('Server listening at port %d', 3000);
});
