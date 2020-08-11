const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path')

app.use(express.static(path.join(__dirname, 'public')));

rooms = [];
connections = [];
connection_index = [];

let logger = () => {
  console.log(rooms);
  setTimeout(logger, 1000);
}

logger();

// On new socket connection (new client)
io.on('connection', (socket) => { 
  // Log the connection.
  console.log(`+++++: ${socket.id} Connected`);

  // Set a deafult username to prevent error logging.
  socket.username = "deafult";

  // Deafult them to not hosting
  socket.host = false;

  // Add thier socket to the readable list.
  connections.push(socket);
  connection_index.push(socket.id);

  // When they disconnect, log it.
  socket.on('disconnect', function() {
    console.log(`-----: ${socket.id} Disconnected`);
  });

  // As they are disconnecting remove them from all rooms and 
  // remove thier socket from the connection.

  socket.on('disconnecting', () => {
    var rooms_loc = Object.keys(io.sockets.adapter.rooms).filter(item => item!=socket.id);

    if(rooms_loc != null){
      rooms_loc.forEach(e => {
        console.log('leaving ', e);
        socket.leave(e);

        if(!io.nsps['/'].adapter.rooms[e]){
          const i = rooms_loc.indexOf(e);
          rooms_loc.splice(i,1);

          const i2 = rooms.indexOf(e);
          rooms.splice(i,1);

          console.log('removing room', e);
          console.log(rooms);
        }
        
        getRoomMembersFunction(e);
      });
    }
  });

  // Echo function to return data to others in a group.
  socket.on('echo', (data) => {
    io.in(data.room).emit(data.type, {
      message: data.data
    });

    //console.log('Echoing', data.data, 'to ', data.room);
  });

  // on 'movement' emit relay an update car function to the room/socket.
  socket.on('moving', (data) => {
    io.in(data.room).emit('updateCar', {
      message: data.data
    });

    console.log(`Car moved in room: ${data.room}, update recipircated.`);
  })

  // On create room, join room and add it to the list.
  // Make the creator the host.
  socket.on('create', (room, your_name) => {
    socket.join(room);

    console.log(`Creating and Joining Room: ${room}`);
    rooms.push(room);

    connections[connections.indexOf(socket)].host = true;
    socket.host = true;

    //console.log(rooms);
    //console.log(io.nsps['/'].adapter.rooms);
  });

  // on socket join, make them *not* host
  socket.on('join', (room, name) => {
    if (rooms.includes(room)) {
      socket.join(room);
    }

    connections[connections.indexOf(socket)].host = false;
    socket.host = false;
  });

  // On getRooms query, reply with rooms.
  socket.on('getRooms', () => {
    socket.emit('rooms', {
      message: rooms
    });

    console.log("Get Rooms Request Recieved and Replied to");
    //console.log(rooms);
  });

  // On setUsername post request, set thier username and log it.
  socket.on('setUsername', (username) => {
    connections[connections.indexOf(socket)].username = username;
    socket.username = username;

    console.log(`Username set! - ${username}`);
  });

  // Reply with users in the room.
  socket.on('getRoomMembers', (room_name) => {
    getRoomMembersFunction(room_name);
  });

  // Begin race function
  socket.on('instigateGame', (data) => {
    let instigator = data.instigator;

    // If they have permission (2nd Degree Security)
    if(connections[connection_index.indexOf(instigator)].host){
      // Log game start
      console.log("GameStart Request Accepted! Starting Game...");
      //console.log(data);

      sockets = [];

      // Instigate Game by creating a socket array with all positions.
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

      // Emit to others in room that the game has started passing in all sockets.
      io.in(data.room).emit('gameStart', {
        message: {text: 'The Game has started!', data: sockets, track_length: data.track_length}
      });
    }else {
      console.log("GameStart Request Denied! - Insuffient Permissions");
    }
  });

  // get socket.rooms as an object, find deafult room and remove it then return the remaining rooms.
  function getAvaliableRooms() {
    let roomKeys = Object.keys(socket.rooms);
    let socketIdIndex = roomKeys.indexOf(socket.id);
    console.log(socketIdIndex, " ", socket.id);
    let rooms = roomKeys.splice(socketIdIndex, 1);
    
    return rooms;
  }

  // Find specific rooms and get all sockets, find those sockets in the pre-defined array of stored sockets and push the sockets.
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

    // Re-emit the sockets as a reply to the initial function query.
    io.in(room_name).emit('postRoomMembers', {
      message: sockets
    });

    //console.log(sockets);
  } 
});

// Console log the connected port.
server.listen(3000, function() {
  console.log('Server listening at port %d', 3000);
});
