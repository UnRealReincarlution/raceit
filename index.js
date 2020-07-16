const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path')

app.use(express.static(path.join(__dirname, 'public')));

rooms = [];

io.on('connection', (socket) => {
  console.log("User Connected");

  socket.on('echo', (data) => {
		socket.emit('echo', {
			message: data
		});

    console.log('Echoing', data);
	});

  socket.on('create', (room, your_name) => {
    socket.join(room);
    
    console.log(`Creating and Joining Room: ${room}`);
    console.log(rooms); 
    rooms.push(room);
  });

  socket.on('join', (room, name) => {
    if(rooms.includes(room)) {
      socket.join(room);
    }
  });

  socket.on('getRooms', () => {
      socket.emit('rooms', {
        message: rooms
      });

      console.log("Get Rooms Request Recieved and Replied to");
      console.log(rooms); 
  });

  function getAvaliableRooms() {
    var roomKeys = Object.keys(socket.rooms);
    var socketIdIndex = roomKeys.indexOf(socket.id);
    console.log(socketIdIndex, " ", socket.id);
    var rooms = roomKeys.splice( socketIdIndex, 1 );
    return rooms;
  }
});

server.listen(3000, function() {
	console.log('Server listening at port %d', 3000);
});
