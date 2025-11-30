const socket = io();

const app = document.getElementById('app');
const nameModal = document.getElementById('nameModal');
const nameForm = document.getElementById('nameForm');
const currentUserSpan = document.getElementById('currentUser');
const nameInput = document.getElementById('nameInput');
const userList = document.getElementById('userList');
const userCount = document.getElementById('userCount');
const startXatBtn = document.getElementById('startXatBtn');

const chatDiv = document.getElementById("chat");
const messages = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");

let users = {};
let selectedUserId= null;

let peer = null;


socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

// Ingresar amb NOM

nameForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  if (!name) return;

  currentUserSpan.textContent = `You are: ${name}`;
  nameModal.style.display = 'none';
  app.style.display = 'block';

  socket.emit('user-joined', name);
});


// Notificar als usuaris qui s'ha UNIT o ha SORTIT

socket.on('user-joined', (user) => {
  users[user.id] = user;
  updateUserCount();
  renderUserList();
  console.log(`User joined: ${user.name} (ID: ${user.id})`);
});

socket.on('user-left', (userId) => {
  if (users[userId]) {
    delete users[userId];
    console.log(`User ${userId} has left`);
  }
  
  if (selectedUserId === userId){
    startXatBtn.disabled = true;
  }
  renderUserList();
}); 


// Llista d'USUARIS

socket.on('user-list', (userList) => {
  users = {};
  userList.forEach(user => {
    users[user.id] = user;
  });
  renderUserList();
});

function renderUserList() {
  userList.innerHTML = '';
  Object.values(users).forEach(user => {
    if (user.id === socket.id) return;

    const userItem = document.createElement('li');

    userItem.textContent = user.name; 
    userItem.dataset.id = user.id;
    userItem.style.cursor = 'pointer';

    if (selectedUserId === user.id){
      userItem.style.background = "#d0f0ff";
      userItem.style.fontWeight = "bold";
    }

    userItem.addEventListener('click', () => {
      selectedUserId = user.id;
      renderUserList();
      startXatBtn.disabled = false;
    });

    userList.appendChild(userItem);
  });
  updateUserCount();
}

function updateUserCount() {
  const count = Object.keys(users).length;
  userCount.textContent = `Connected users: ${count}`;
}


// Iniciador del Chat P2P

startXatBtn.addEventListener ('click', () => {
  if (!selectedUserId) return;

  console.log("Iniciant 2P2 amb: ", selectedUserId);
  startChat(selectedUserId);
});


function startChat(targetId) {

  peer = new SimplePeer({initiator: true, trickle: false});

  console.log("Soc l'iniciador");

  peer.on("signal", (data) => {
    socket.emit("signal", {
      target: targetId,
      from: socket.id,
      signal: data
    });
  });

  peer.on("connect", () => {
    openChat();
    console.log("P2P CONNECTED");
  });

  peer.on("data", msg => {
    appendMessage("Ell", msg.toString());
  });
}


// Rebre el SIGNAL de l'INICIADOR

socket.on("signal", ({ from, signal }) => {

  if (!peer) {
    peer = new SimplePeer({ initiator: false, trickle: false});

    peer.on("signal", data => {
      socket.emit("signal", {
        target: from,
        from: socket.id,
        signal: data 
      });
    });

    peer.on("connect", () => {
      console.log("P2P CONNECTED (Receptor)");
      openChat();
    });

    peer.on("data", msg => {
      appendMessage("Ell ", msg.toString());
    });
  }
  peer.signal(signal);
});


// Mostar el Chat

function openChat() {
  app.style.display = "none";
  chatDiv.style.display = "block";
  appendMessage("Sistema", "Connexió establerta!");
}

sendBtn.onclick = () => {
  const text = msgInput.value.trim();
  if (!text) return;

  peer.send(text);
  appendMessage("Tu", text);

  msgInput.value = "";
}

function appendMessage(sender, text){
  const p = document.createElement("p");
  p.textContent = `${sender}: ${text}`;
  messages.appendChild(p);
  messages.scrollTop = messages.scrollHeight;
}

