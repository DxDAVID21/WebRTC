const socket = io();

const app = document.getElementById('app');
const nameModal = document.getElementById('nameModal');
const nameForm = document.getElementById('nameForm');
const currentUserSpan = document.getElementById('currentUser');
const nameInput = document.getElementById('nameInput');
const userList = document.getElementById('userList');
const userCount = document.getElementById('userCount');

var Peer = require('simple-peer');

const peer = undefined;

let users = {};
let currentUser = null;

let peerInit;
let peerNoInit;
let userToConnect;

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});


nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  
  currentUser = name;
  currentUserSpan.textContent = `You are: ${currentUser}`;
  nameModal.style.display = 'none';
  app.style.display = 'block';

  socket.emit('user-joined', name);
  nameInput.value = '';
  console.log('Name submitted:', name);
});

socket.on('user-joined', (user) => {
  users[user.id] = user;
  updateUserCount();
  renderUserList();
  console.log(`User joined: ${user.name} (ID: ${user.id})`);
});

socket.on('user-left', (userId) => {
  if (users[userId]) {
    delete users[userId];
    renderUserList();
    console.log(`User ${userId} has left`);
  }
  console.log('Disconnected from server');
}); 

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
    const userItem = document.createElement('div');
    userItem.textContent = user.name + (user.id === socket.id ? ' (You)' : '');
    userList.appendChild(userItem);
  });
  updateUserCount();
}

function updateUserCount() {
  const count = Object.keys(users).length;
  userCount.textContent = `Connected users: ${count}`;
}

function getMyPeer(){
  console.log("Soc l'iniciador");
  peer = new Peer ({
    initiator: true,
    trickle: false,
  });

  peer.on("signal", (data) => {
    console.log("My")
  })
}

