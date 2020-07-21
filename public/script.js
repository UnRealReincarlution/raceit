class race {
  constructor(room, name = "invalid", position = 0, track_length = 15) {
    this.position = position;
    this.room_name = room;
    this.nickname = name;
    this.track_length = track_length;

    socket.emit('setUsername', name);
  }

  moveForward() {
    this.position++;

    socket.emit('echo', {
      room: this.room_name,
      type: 'movement',
      data: {
        position: this.position,
        id: socket.id,
        name: this.nickname
      }
    });
  }

  getRoomName() {
    return this.room_name;
  }

  getNickName() {
    return this.nickname;
  }

  setHost(variable) {
    this.hosting = variable;
  }

  getTrackLength(){
    return this.track_length;
  }

  setTrackLength(length){
    this.track_length = length;
  }
}

class player {
  constructor(name, id, position = 0){
    this.name = name,
    this.id = id,
    this.position = position;
  }

  setPosition(position){
    this.position = position;
  }
}

let race_;
let players = [];
let socket = io();

socket.on('echo', (data) => {
  console.log('received echo', data)
});

socket.on('rooms', (data) => {
  console.log('recieved room data', data);
  loadRooms(data);
});

socket.on('postRoomMembers', (data) => {
  console.log('recieved room person data', data);
  loadMembers(data);
});

socket.on('updateCar', (data) => {
  console.log(data);

  renderGame(data);
});

socket.on('movement', (data) => {
  console.log(data);

  updateRender(data);
});

$("#host_game").click(function(e) {
  if ($(e.target).is("#host_game")) {
    $("#host_game").removeClass("active_pannel");
  }
})

$("#join_game").click(function(e) {
  if ($(e.target).is("#join_game")) {
    $("#join_game").removeClass("active_pannel");
  }
})

$("#start_button").click((e) => {
  initiateGame();
});

$(document).ready(() => {
  if (!localStorage.getItem('themeSwitch')) {
    document.documentElement.setAttribute('theme', 'light');
    localStorage.setItem('themeSwitch', 'light');
  } else {
    document.documentElement.setAttribute('theme', localStorage.getItem('themeSwitch'));
  }
});

function users_name() {
  return prompt("Please enter your name");
}

function hostRace() {
  let room_name = $("#room_name_choice").val();
  let user_name = users_name();
  console.log(room_name);

  socket.emit('create', room_name);
  joinRaceFunction(room_name, user_name, true)
}

function joinRace(room_name, user_name) {
  user_name = users_name();
  socket.emit('join', room_name);
  joinRaceFunction(room_name, user_name);
}

function joinRaceFunction(room_name, username, hosting = false) {
  race_ = new race(room_name, username);
  $("#game_name").html(race_.getRoomName());

  $("#choose_field").addClass("hidden");
  $("#race_div").removeClass("hidden");
  $(".input_field").removeClass("active_pannel");
  $("#game_name").removeClass("hidden");

  socket.emit('getRoomMembers', room_name);
}

function showHostOptions() {
  $("#host_game").addClass("active_pannel");
}

function showJoinOptions() {
  $("#join_game").addClass("active_pannel");

  socket.emit('getRooms', '');
}

let loadRooms = (data) => {
  //console.log(data.message);
  while (document.getElementById("room_list").firstChild) {
    document.getElementById("room_list").removeChild(document.getElementById("room_list").firstChild);
  }
  data.message.forEach(element => {
    console.log(element);

    var room_element = document.createElement("li");
    room_element.setAttribute('game-join', element);
    room_element.setAttribute('onclick', `joinRace("${element}")`);

    var room_div = document.createElement("div");

    var room_name = document.createElement("p");

        element = element.replace(/>/g,"&#62;");
        element = element.replace(/</g,"&#60;");

        room_name.innerHTML = element;
        room_div.appendChild(room_name);

    room_element.appendChild(room_div);
    document.getElementById("room_list").appendChild(room_element);
  });
}

async function loadMembers(data) {
  console.log(data);

  while (document.getElementById("member_list_dump").firstChild) {
    document.getElementById("member_list_dump").removeChild(document.getElementById("member_list_dump").firstChild);
  }

  var user_count = data.message.length;
  var user_cap = 15;
  
  $("#member_list_title").html(`Member List  <i>${user_count}/${user_cap}</i>`);

  race_.setHost(false);

  data.message.forEach(element => {
    var this_instance = players.findIndex(x => x.id === element.id);
    console.log(this_instance, " - LOCATION OF ", element.name);
    if(this_instance == -1) players.push(new player(element.name, element.id));

    var this_div = document.createElement("li");

        element.name = element.name.replace(/>/g,"&#62;");
        element.name = element.name.replace(/</g,"&#60;");

        var div_text = document.createElement("p");
            div_text.innerHTML = element.name;

        if(socket.id == element.id) div_text.innerHTML += " (YOU) ";

        this_div.setAttribute('userid', element.id);
        this_div.append(div_text);

    if(element.hosting){
      var this_new_div = document.createElement("h6");
          this_new_div.innerHTML = "HOST";

      this_div.append(this_new_div);
    }

    if(socket.id == element.id && element.hosting){
      race_.setHost(true);
      $("#game_settings").addClass("active");
    }

    $("#member_list_dump").append(this_div);
  });
}

function initiateGame() {
  socket.emit('instigateGame', {room: race_.getRoomName(), instigator: socket.id, track_length: $("#track_length").val()});
  race_.setTrackLength($("#track_length").val());
}

function renderGame(data) {
  console.log(data);

  //Create All "p" elements with the format:
  // [position] : [name] : [id] 
  // e.g.
  // 5 : Seb : ujLfph2ITfKxigKTAAAK

  //$(`[carid=${data.id}]`)

  data.message.data.forEach(e => {
    var user = document.createElement("div");

    var users_image = document.createElement("img");
        users_image.src = 'https://cdn.pixabay.com/photo/2014/04/03/10/03/race-car-309713_960_720.png';
    
    var users_name = document.createElement("p");
        users_name.innerHTML = `${e.name} : ${e.position}`;

    user.appendChild(users_name);
    user.appendChild(users_image);
    user.setAttribute("car-id", e.id);
    user.classList.add("car");

    document.getElementById("game_view_cars").appendChild(user);

    var pole_user = document.createElement("p");
        pole_user.innerHTML = `${e.position}:  ${e.name}`;
        pole_user.setAttribute("pole-id", e.id);

    document.getElementById("pole_positions").appendChild(pole_user);
  });
}

function updateRender(data) {
  console.log("UPDATING", data);

  var this_instance = players.findIndex(x => x.id === data.message.id);
  players[this_instance].setPosition(data.message.position);

  players.sort((a, b) => {
    return b.position - a.position;
  });
  
  players.forEach((element, index) => {
    var elem = $(`[pole-id="${element.id}"]`);
        elem.css('order', index);
        elem.text(`${index+1}: ${element.name}`);
  });

  $(`[car-id="${data.message.id}"] p`).text(`${data.message.name} : ${data.message.position}`);
  $(`[car-id="${data.message.id}"]`).css('width', `${((data.message.position / race_.getTrackLength()) * 10) + 15}%`);
}

socket.on('gameStart', (data) => {
  renderGame(data);
});

function toggleTheme() {
  var darkThemeSel = localStorage.getItem('themeSwitch') === 'dark';
  console.log("Switching theme", darkThemeSel);

  if (localStorage.getItem('themeSwitch')) {
    if (darkThemeSel) {
      document.documentElement.setAttribute('theme', 'light');
      localStorage.setItem('themeSwitch', 'light');
    }
    else {
      document.documentElement.setAttribute('theme', 'dark');
      localStorage.setItem('themeSwitch', 'dark')
    }
  } else {
    document.documentElement.setAttribute('theme', 'light');
    localStorage.setItem('themeSwitch', 'light');
  }
}

window.onbeforeunload = function(e) {
  return 'Are you sure you want to leave this page?  You will lose any unsaved data.';
};