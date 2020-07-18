class race {
    constructor(room, position = 0){
        this.position = position;
        this.room_name = room;
    }

    moveForward() {
        console.log("Itterating!");
        this.position++;
    }

    getRoomName() {
      return this.room_name;
    }
}

$(document).ready(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const hosting = urlParams.get('hosting');
    console.log(hosting);

    const room = urlParams.get('room_name');
    console.log(room);

    if(hosting == 'true' || hosting == 'false'){
      joinRaceFunction(room);
    }

    if(!localStorage.getItem('themeSwitch')){
      document.documentElement.setAttribute('theme', 'light');
      localStorage.setItem('themeSwitch', 'light');
    }else{
      document.documentElement.setAttribute('theme', localStorage.getItem('themeSwitch'));
    }
});

let race_;

function hostRace() {
  let room_name = $("#room_name_choice").val();
  console.log(room_name);

  socket.emit('create', room_name);
  joinRaceFunction(room_name, true) 
}

function joinRace(room_name) {
  socket.emit('join', room_name);
  joinRaceFunction(room_name);
}

function joinRaceFunction(room_name, hosting = false) {
  race_ = new race(room_name);
  $("#game_name").html(race_.getRoomName());

  $("#choose_field").addClass("hidden");
  $("#race_div").removeClass("hidden");
  $(".input_field").removeClass("active_pannel");
  $("game_name").removeClass("hidden");

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
  while(document.getElementById("room_list").firstChild){
    document.getElementById("room_list").removeChild(document.getElementById("room_list").firstChild);
  }
  data.message.forEach(element => {
    console.log(element);

    var room_element = document.createElement("li");
        room_element.setAttribute('game-join', element);
        room_element.setAttribute('onclick', `joinRace("${element}")`);

    var room_div = document.createElement("div");

    var room_name = document.createElement("p");
        room_name.innerHTML = element;
        room_div.appendChild(room_name);
    
    room_element.appendChild(room_div);
    document.getElementById("room_list").appendChild(room_element);
  });
}

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
});

function toggleTheme() {
  var darkThemeSel = localStorage.getItem('themeSwitch') === 'dark';
  console.log("Switching theme", darkThemeSel);

  if(localStorage.getItem('themeSwitch')){
    if(darkThemeSel){
      document.documentElement.setAttribute('theme', 'light');
      localStorage.setItem('themeSwitch', 'light');
    }
    else{
      document.documentElement.setAttribute('theme', 'dark');
      localStorage.setItem('themeSwitch', 'dark')
    }
  }else{
      document.documentElement.setAttribute('theme', 'light');
      localStorage.setItem('themeSwitch', 'light');
  }
}

$("#host_game").click(function(e) {
  if($(e.target).is("#host_game")){
    $("#host_game").removeClass("active_pannel");
  }
})

$("#join_game").click(function(e) {
  if($(e.target).is("#join_game")){
    $("#join_game").removeClass("active_pannel");
  }
})