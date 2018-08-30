'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

let randomClientNames = ["Strawberry","Kiwi","Apple","Pear","Orange"];

wss.on('connection', function connection (ws, req) {
  let randomIndex = Math.floor(Math.random() * Math.floor(randomClientNames.length));

  console.log('Client ' + randomClientNames [randomIndex] + ' connected');
  ws.on('close', () => console.log('Client ' + randomClientNames [randomIndex]  + ' disconnected'));
});

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);