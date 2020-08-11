// define a race class which controls the race.
class race {
  // on create call (constructor)
  // set client position, room name and nickname
  constructor(room, name = "invalid", position = 0, track_length = 15) {
    this.position = position;
    this.room_name = room;
    this.nickname = name;
    this.track_length = track_length;
    this.finished = false;
    this.inGame = false;

    socket.emit('setUsername', name);
  }

  // Define movement script
  moveForward() {
    // If user has not finished
    if(this.position !== this.track_length * 10){
      // Move them forward client side.
      this.position++;

      // Emmit this change as an echo to all other connected sockets in the room.
      socket.emit('echo', {
        room: this.room_name,
        type: 'movement',
        data: {
          position: this.position,
          id: socket.id,
          name: this.nickname
        }
      });
    }else{
      // Otherise call finishing script.
      this.finish();
    }
  }

  // Finishin script.
  finish() {
    // Re-check finish to prevent clientside call
    if(this.position == this.track_length * 10){
      // Locally store change
      this.finished = true;

      // Emmit this change to all other sockets.
      socket.emit('echo', {
        room: this.room_name,
        type: 'finish',
        data: {
          position: this.position,
          id: socket.id,
          name: this.nickname
        }
      });
    }
  }

  // 5 functions that return race values or set them.
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

// Player constructor for other players in the race.
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

// Initiate socket.io.

let race_;
let players = [];
let socket = io();

// on rooms, load them
socket.on('rooms', (data) => {
  //console.log('recieved room data', data);
  loadRooms(data);
});

// on recieving room members, load them
socket.on('postRoomMembers', (data) => {
  //console.log('recieved room person data', data);
  loadMembers(data);
});

// on car position update, re-render frame.
socket.on('updateCar', (data) => {
  //console.log(data);

  if(race_.inGame) renderGame(data);
});

// on socket movement, update render.
socket.on('movement', (data) => {
  //console.log(data);
  updateRender(data);
});

// on finish, mark changes
socket.on('finish', (data) => {
  //console.log(data);
  updateChallenger(data);
});

// When game starts, update render
socket.on('gameStart', (data) => {
  console.log("Game Starting!");

  while(document.getElementById("game_view_cars").lastChild){
    if(document.getElementById("game_view_cars").lastChild.id !== "full_view"){
      document.getElementById("game_view_cars").removeChild(document.getElementById("game_view_cars").lastChild);
    }else{
      break;
    }
  }
  
  race_.inGame = true;

  if(race_.inGame) {
    startTimer();
    race_.position = 0;
    
    let timing_interval = setInterval(function(){
      if(race_.inGame) { 
        renderGame(data); 
        clearInterval(timing_interval); 
      }
    }, 1000);
  }
});

$("#theme_toggle").click(function(e) {
  toggleTheme();
});

// Show host fragment.
$("#host_game").click(function(e) {
  if ($(e.target).is("#host_game")) {
    $("#host_game").removeClass("active_pannel");
  }
})

// Show join fragment
$("#join_game").click(function(e) {
  if ($(e.target).is("#join_game")) {
    $("#join_game").removeClass("active_pannel");
  }
})

// Start game
$("#start_button").click((e) => {
  $("#full_view h1").text("STARTING");
  initiateGame();
});

// On move button press, move car.
$("#itterate_car_button").click((e) => {
  race_.moveForward();
});

// Switch theme (dark to light or vise versa)
$(document).ready(() => {
  if(localStorage.getItem('firstTime') == undefined){
    localStorage.setItem('firstTime', true);
  }else {
    localStorage.setItem('firstTime', false);
  }

  if (!localStorage.getItem('themeSwitch')) {
    document.documentElement.setAttribute('theme', 'light');
    localStorage.setItem('themeSwitch', 'light');
  } else {
    document.documentElement.setAttribute('theme', localStorage.getItem('themeSwitch'));
  }
});

function startTimer() {
  let time = 3;
  $("#full_view").removeClass("hidden");

  let k_cou = setInterval(() => {
    $(".full_view").html(time);

    if(time == 0) {
      $("#full_view").addClass("hidden");
      race_.inGame = true;
      time == 3;
      clearInterval(k_cou);
    }

    time -= 1;
  }, 1000);
}

// get users name
function users_name() {
  return prompt("Please enter your name");
}

// host the race from host popup
function hostRace() {
  // Get name of room
  let room_name = $("#room_name_choice").val();

  // Get users name
  let user_name = users_name();
  //console.log(room_name);

  // Create room
  socket.emit('create', room_name);

  // Join the room as host
  joinRaceFunction(room_name, user_name, true)
}

// updateChallenger as finished 
function updateChallenger(data) {
  $(`[car-id="${data.message.id}"]`).css('width', `${((data.message.position / race_.getTrackLength()) * 10)}%`);

  $(`[car-id="${data.message.id}"] p`).text(`⚐ ${data.message.name} has Finished! ⚐`);
}

// Join the race
function joinRace(room_name, user_name) {
  // Get users name
  user_name = users_name();

  // Join room and race.
  socket.emit('join', room_name);
  joinRaceFunction(room_name, user_name);
}

// Main join race function
function joinRaceFunction(room_name, username, hosting = false) {
  // create new race from race class passing in room name and username
  race_ = new race(room_name, username);

  // Set the game_name element to display the room name
  $("#game_name").html(race_.getRoomName());
  
  // Change UI
  $("#choose_field").addClass("hidden");
  $("#race_div").removeClass("hidden");
  $(".input_field").removeClass("active_pannel");
  $("#game_name").removeClass("hidden");

  // Get room members for rendering member list.
  socket.emit('getRoomMembers', room_name);

  if(localStorage.getItem('firstTime') == true){
    
  }

  if(race_.inGame == true){
    console.log('already in game!');
  }
}

// Show host popup
function showHostOptions() {
  $("#host_game").addClass("active_pannel");
}

// show join popup and render rooms.
function showJoinOptions() {
  $("#join_game").addClass("active_pannel");

  socket.emit('getRooms', '');
}

// Load all rooms from the getRooms request and remove <> elements as 
// clientside xxs revention aswell as serverside. (2 layered)
let loadRooms = (data) => {
  //console.log(data.message);
  while (document.getElementById("room_list").firstChild) {
    document.getElementById("room_list").removeChild(document.getElementById("room_list").firstChild);
  }
  data.message.forEach(element => {
    //console.log(element);

    // Create list element
    let room_element = document.createElement("li");

    // set custom attribute 'game-join' to the element being rendered (id)
    room_element.setAttribute('game-join', element);

    // create an onclick function passing in the room id
    room_element.setAttribute('onclick', `joinRace("${element}")`);

    // create a div inside the list element
    let room_div = document.createElement("div");

    // create a paragraph element 
    let room_name = document.createElement("p");

        // XXS Prevention
        element = element.replace(/>/g,"&#62;");
        element = element.replace(/</g,"&#60;");

        // Set InnerHTML of paragraph to new name
        room_name.innerHTML = element;

        // Append paragraph to div
        room_div.appendChild(room_name);

    // append div to list
    room_element.appendChild(room_div);

    // append list element to list
    document.getElementById("room_list").appendChild(room_element);
  });
}

async function loadMembers(data) {
  //console.log(data);
  // remove all existing members from div
  while (document.getElementById("member_list_dump").firstChild) {
    document.getElementById("member_list_dump").removeChild(document.getElementById("member_list_dump").firstChild);
  }

  // display user count / maximum
  let user_count = data.message.length;
  let user_cap = 15;
  
  $("#member_list_title").html(`Member List  <i>${user_count}/${user_cap}</i>`);

  // set host to false
  race_.setHost(false);

  // for each member
  data.message.forEach(element => {
    // find them in the players array
    let this_instance = players.findIndex(x => x.id === element.id);
    
    // If they do not exist yet, add them
    if(this_instance == -1) players.push(new player(element.name, element.id));

    // create list element
    let this_div = document.createElement("li");
        // XXS CLientside
        element.name = element.name.replace(/>/g,"&#62;");
        element.name = element.name.replace(/</g,"&#60;");
        
        // create paragraph and set to players name
        let div_text = document.createElement("p");
            div_text.innerHTML = element.name;

        // if it is the client display (YOU) to indicate that it is you
        if(socket.id == element.id) div_text.innerHTML += " (YOU) ";

        // set custom attribute userid to the players id for kicking etc..
        this_div.setAttribute('userid', element.id);
        this_div.append(div_text);

    // If player is the host, indicate as such
    if(element.hosting){
      let this_new_div = document.createElement("h6");
          this_new_div.innerHTML = "HOST";

      $(".full_view h1").html("Awaiting Your Command");

      this_div.append(this_new_div);
    }

    // If you are hosting set that clientside and make the game setting acessable.
    // Although if the client undoes this, the server will still regect thier request - this is simply a visual indicator.
    if(socket.id == element.id && element.hosting){
      race_.setHost(true);
      $("#game_settings").addClass("active");
    }

    // Append this /\.
    $("#member_list_dump").append(this_div);
  });
}

// Create game
function initiateGame() {
  // emit instigation
  socket.emit('instigateGame', {
    room: race_.getRoomName(),
    instigator: socket.id, 
    track_length: $("#track_length").val()
  });

  // set track length to value defined.
  race_.setTrackLength($("#track_length").val());
}

function renderGame(data) {
  $("#start_button").html('Race Again?');

  // Set local track length to emmited track length for non-hosts.  
  race_.setTrackLength(data.message.track_length);

  // Create All "p" elements with the format:
  // [name] : [location] 
  // e.g.
  // Seb : (5.5)

  // Remove Status element
  //$(".full_view").addClass("hidden");

  while(document.getElementById("game_view_cars").lastChild){
    if(document.getElementById("game_view_cars").lastChild.id !== "full_view"){
      document.getElementById("game_view_cars").removeChild(document.getElementById("game_view_cars").lastChild);
    }else{
      break;
    }
  }

  while(document.getElementById("pole_positions").lastChild){
    document.getElementById("pole_positions").removeChild(document.getElementById("pole_positions").lastChild);
  }

  // For each car
  data.message.data.forEach(e => {
    let user = document.createElement("div");

    // create a car image
    let users_image = document.createElement("img");
        users_image.src = 'https://cdn.pixabay.com/photo/2014/04/03/10/03/race-car-309713_960_720.png';
    
    // creates paragraph with name and location
    let users_name = document.createElement("p");
        users_name.innerHTML = `${e.name} : ${e.position}`;

    // append all
    user.appendChild(users_name);
    user.appendChild(users_image);
    user.setAttribute("car-id", e.id);
    user.classList.add("car");

    document.getElementById("game_view_cars").appendChild(user);

    // create pole positions e.g. (1st Seb, 2nd ....)
    let pole_user = document.createElement("p");
        pole_user.innerHTML = `- : ${e.name}`;
        pole_user.setAttribute("pole-id", e.id);
        pole_user.style.fontSize = 15;

    document.getElementById("pole_positions").appendChild(pole_user);
  });
}

// Update the render to change the width of the car element.
function updateRender(data) {
  //console.log("UPDATING", data);

  let this_instance = players.findIndex(x => x.id === data.message.id);
  players[this_instance].setPosition(data.message.position);

  players.sort((a, b) => {
    return b.position - a.position;
  });
  
  players.forEach((element, index) => {
    let hyp = 1 / (index + 1);
    let elem = $(`[pole-id="${element.id}"]`);
        elem.css('order', index);
        elem.text(`${ordinal_suffix_of(index+1)}: ${element.name}`);
        elem.css('font-size', hyp * 30)

    if(hyp * 30 <= 15) elem.css('font-size', 15);
  });

  $(`[car-id="${data.message.id}"] p`).text(`${data.message.name} (${data.message.position / 10})`);
  $(`[car-id="${data.message.id}"]`).css('width', `${((data.message.position / race_.getTrackLength()) * 10)}%`);

  if(data.message.position == race_.getTrackLength()){
    race_.finish();
  }
}

function toggleTheme() {
  let darkThemeSel = localStorage.getItem('themeSwitch') === 'dark';
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

function ordinal_suffix_of(i) {
    let j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}