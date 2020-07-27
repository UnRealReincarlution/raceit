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

  socket.host = false;

  connections.push(socket);
  connection_index.push(socket.id);

  socket.on('disconnect', function() {
    console.log(`-----: ${socket.id} Disconnected`);
  });

  socket.on('disconnecting', () => {
    var rooms = Object.keys(io.sockets.adapter.rooms).filter(item => item!=socket.id);

    if(rooms != null){
      rooms.forEach(e => {
        console.log('leaving ', e);

        socket.leave(e);
        getRoomMembersFunction(e);
      });
    }
  });

  socket.on('echo', (data) => {
    io.in(data.room).emit(data.type, {
      message: data.data
    });

    //console.log('Echoing', data.data, 'to ', data.room);
  });

  socket.on('moving', (data) => {
    io.in(data.room).emit('updateCar', {
      message: data.data
    });

    console.log(`Car moved in room: ${data.room}, update recipircated.`);
  })

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
    getRoomMembersFunction(room_name);
  });

  socket.on('instigateGame', (data) => {
    var instigator = data.instigator;

    if(connections[connection_index.indexOf(instigator)].host){
      console.log("GameStart Request Accepted! Starting Game...");
      //console.log(data);

      sockets = [];

      if(io.nsps['/'].adapter.rooms[data.room]){
        for (socketID in io.nsps['/'].adapter.rooms[data.room].sockets) {
          sockets.push({
            name: connections[connection_index.indexOf(socketID)].username, 
            id: socketID, 
            hosting: connections[connection_index.indexOf(socketID)].host, 
            position: 0
          });
        }
      }

      io.in(data.room).emit('gameStart', {
        message: {text: 'The Game has started!', data: sockets, track_length: data.track_length}
      });
    }else {
      console.log("GameStart Request Denied! - Insuffient Permissions");
    }
  });

  function getAvaliableRooms() {
    var roomKeys = Object.keys(socket.rooms);
    var socketIdIndex = roomKeys.indexOf(socket.id);
    console.log(socketIdIndex, " ", socket.id);
    var rooms = roomKeys.splice(socketIdIndex, 1);
    return rooms;
  }

  function getRoomMembersFunction(room_name) {
    console.log("Get Room Members Request Recieved and Replied to");
    sockets = [];

    if(io.nsps['/'].adapter.rooms[room_name]){
      for (socketID in io.nsps['/'].adapter.rooms[room_name].sockets) {
        sockets.push({
          name: connections[connection_index.indexOf(socketID)].username, 
          id: socketID, 
          hosting: connections[connection_index.indexOf(socketID)].host
        });
      }
    }

    io.in(room_name).emit('postRoomMembers', {
      message: sockets
    });

    //console.log(sockets);
  } 
});

server.listen(3000, function() {
  console.log('Server listening at port %d', 3000);
});
