const WebSocket = require('ws');
const Express = require('express');
const http = require('http');
const url = require('url');

/* *************************************** Server Startup *************************************** */
const app = Express();
const httpServer = http.createServer(app);
httpServer.listen(
  process.argv[2] || 4930,
  process.argv[3] || 'localhost',
  () => console.log(`Listening on ${httpServer.address().address}:${httpServer.address().port}`),
);
const wss = new WebSocket.Server({ server: httpServer, clientTracking: true });
wss.userMap = new Map();
wss.name = 'GABServer';
/* ********************************************************************************************** */

/* ************************************** Utility Function ************************************** */
const validUsername = name => name !== undefined && /^[0-9a-zA-Z]{3,10}$/.test(name);

const GABLog = {
  log: text => console.log(`[LOG] ${new Date().toUTCString()}: ${text}`),
  warn: text => console.warn(`[WARN] ${new Date().toUTCString()}: ${text}`),
  error: text => console.error(`[ERROR] ${new Date().toUTCString()}: ${text}`),
};

const broadcast = (data) => {
  wss.clients.forEach(socket => socket.readyState === WebSocket.OPEN && socket.send(data));
};
/* ********************************************************************************************** */

/* *************************************** Server Message *************************************** */
const craftMessage = (from, to, kind, data) => JSON.stringify({
  from, to, kind, data,
});

const Message = {
  // Messages with static data
  INVALID_USERNAME: uname => craftMessage(wss.name, uname, 'error',
    'Your username is invalid, please try again with the GET parameter "username". Usernames must '
    + 'be alphanumeric between 3 and 10 characters. Terminating Connection.'),
  TAKEN_USERNAME: uname => craftMessage(wss.name, uname, 'error',
    'Your username is taken, please try again with a different name. Terminating Connection.'),
  READ_ERROR: uname => craftMessage(wss.name, uname, 'error',
    'Error reading message.'),
  KIND_ERROR: uname => craftMessage(wss.name, uname, 'error', 'Unknown or invalid kind.'),
  NO_PONG: uname => craftMessage(wss.name, uname, 'error',
    'Did not get a return Pong. Terminating Connection.'),

  // Messages that only require the 'to' field
  USER_LIST: uname => craftMessage(wss.name, uname, 'userlist',
    Array.from(wss.userMap.keys()).join(',')),
  JOIN_SERVER: uname => craftMessage(wss.name, 'all', 'connection',
    `${uname} has joined the server!`),
  LEFT_SERVER: uname => craftMessage(wss.name, 'all', 'connection',
    `${uname} has left the server!`),
  WHOAMI: uname => craftMessage(wss.name, uname, 'whoami', `You are ${uname}`),

  // Messages that require more info
  USER_NOT_FOUND: (uname, otherUname) => craftMessage(wss.name, uname, 'error',
    `No user found by the name of ${otherUname}.`),
  CHAT: (uname, data) => craftMessage(uname, 'all', 'chat', data),
  DIRECT: (uname, otherUname, data) => craftMessage(uname, otherUname, 'direct', data),
};
/* ********************************************************************************************** */

function handleMessage(socket, username, strMessage) {
  // Check for Malformed JSON Objects
  let message;
  try {
    message = JSON.parse(strMessage);
  } catch (e) {
    GABLog.error(e);
    socket.send(Message.READ_ERROR(username));
    return;
  }

  // Find user for the "to" field if they exist. Not relevant for anything other than direct message
  const toSocket = wss.userMap.get(message.to);

  // Send the approiate message
  switch (message.kind) {
    case 'chat': broadcast(Message.CHAT(username, message.data)); break;
    case 'userlist': socket.send(Message.USER_LIST(username)); break;
    case 'whoami': socket.send(Message.WHOAMI(username)); break;
    case 'direct':
      if (toSocket) toSocket.send(Message.DIRECT(username, message.to, message.data));
      else socket.send(Message.USER_NOT_FOUND(username, message.to));
      break;
    default: socket.send(Message.KIND_ERROR(username));
  }
}

// The following line is to allow access to socket.isAlive without warning (ESLint)
/*
eslint no-param-reassign: ["error",{ "props": true, "ignorePropertyModificationsFor": ["socket"]}]
*/
wss.on('connection', (socket, request) => {
  // Get the username from the query string
  const { username } = url.parse(request.url, true).query;

  // Set the connection to be alive and set up the heartbeat event
  socket.isAlive = true;
  socket.on('pong', () => { socket.isAlive = true; });

  if (!validUsername(username)) {
    socket.send(Message.INVALID_USERNAME(username));
    socket.terminate();

    GABLog.log('Invalid Username Connection Was Denied');
    return;
  }

  if (wss.userMap.has(username) || username === wss.name) {
    socket.send(Message.TAKEN_USERNAME(username));
    socket.terminate();

    GABLog.log('Duplicate Username Connection Was Denied');
    return;
  }

  // Add username mapping to socket (for quick look up)
  wss.userMap.set(username, socket);
  GABLog.log(`New Connection from ${username} from ${request.connection.remoteAddress}`);

  // Message event and handle message
  socket.on('message', message => handleMessage(socket, username, message));

  // Close event, tell others, and delete user from mapping
  socket.on('close', () => {
    broadcast(Message.LEFT_SERVER(username));
    wss.userMap.delete(username);
  });

  // Tell others a new person has arrived
  broadcast(Message.JOIN_SERVER(username));
});

// Heartbeat
setInterval(() => {
  GABLog.log('Checking Heartbeats...');
  wss.clients.forEach((socket) => {
    if (socket.isAlive === false) {
      GABLog.log('Terminating a Broken Connection');
      socket.send(Message.NO_PONG());
      socket.terminate();
      return;
    }

    socket.isAlive = false;
    socket.ping(() => {});
  });
}, 30000);
