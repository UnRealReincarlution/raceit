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

    const room = urlParams.get('room');
    console.log(room);

    if(hosting == true || hosting == false){
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
  window.location.href = `race.html?hosting=true&room_name=${room_name}`; 
}

function joinRace(room_name) {
  window.location.href = `race.html?hosting=false&room_name=${room_name}`; 
}

function joinRaceFunction(room_name) {
  race_ = new race(room_name);
  socket.emit(room_name, "Hey!");
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
  data.message.forEach(element => {
    console.log(element);

    var room_element = document.createElement("li");
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