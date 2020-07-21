class race {
  constructor(room, name = "invalid", position = 0) {
    this.position = position;
    this.room_name = room;
    this.nickname = name;

    socket.emit('setUsername', name);
  }

  moveForward() {
    this.position++;

    socket.emit('moving', {
      room: this.room_name,
      data: {
        position: this.position,
        id: socket.id
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
}

let race_;
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
})

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
  loadInfo(data);
  console.log(data);

  while (document.getElementById("member_list_dump").firstChild) {
    document.getElementById("member_list_dump").removeChild(document.getElementById("member_list_dump").firstChild);
  }

  var user_count = data.message.length;
  var user_cap = 15;
  
  $("#member_list_title").html(`Member List  <i>${user_count}/${user_cap}</i>`);

  race_.setHost(false);

  data.message.forEach(element => {
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
    }

    $("#member_list_dump").append(this_div);
  });
}

function initiateGame() {
  socket.emit('instigateGame');
}

function renderGame(data) {
  console.log(data);

  //Create All "p" elements with the format:
  // [position] : [name] : [id] 
  // e.g.
  // 5 : Seb : ujLfph2ITfKxigKTAAAK

  //$(`[carid=${data.id}]`)
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

