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


wss.on('connection', function connection (ws, req) {
  let clientArray = Array.from(wss.clients.values());
  console.log('Client ' + clientArray[wss.clients.size-1] + ' connected');
  ws.on('close', () => console.log('Client ' + clientArray[wss.clients.size-1]  + ' disconnected'));
});

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);