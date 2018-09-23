"use strict";

import { express } from 'express';
import { WebSocket } from 'ws';
import * as path from 'path';

const PORT = process.env.PORT || 3000;

let __dirname = path.resolve(path.dirname(''));

const INDEX = path.join(__dirname, "index.html");

const server = express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new WebSocket.Server ({ server, clientTracking: true });

import * as generator from './generation.mjs';
import * as gameData from './gameData.mjs';

const CLIENTS = [];

let games = [];

function noop() {}
 
function heartbeat() {
  this.isAlive = true;
}

wss.on("connection", function connection(ws, req) {
  CLIENTS.push(ws);
  CLIENTS[CLIENTS.length - 1].hasSentInput = false;

  ws.isAlive = true;
  ws.onmessage = function(event) {
    CLIENTS[event.data].hasSentInput = true;
  };

  if (games.length === 0) {
    generator.createGame();

    wss.clients.forEach(client => {
      let message = {
        messageType: "NAME",
        name: games[0].players[0].name,
        playerIndex: 0
      };

      client.send(JSON.stringify(message));
      console.log("Creating new game");
    });
  } else {
    let randomIndex = Math.floor(
      Math.random() * Math.floor(gameData.randomPlayerNames.length)
    );
    let playername = gameData.randomPlayerNames[randomIndex];
    let player = generator.createPlayer(playername, 45, 10, 15, 10, 10, 5, 2, 2);

    generator.assignPlayerTraits(player);

    games[0].players.push(player);

    console.log(
      "Generated " +
        player.name +
        " the " +
        player.negativeTrait.name +
        " yet " +
        player.positiveTrait.name
    );

    let message = {
      messageType: "NAME",
      name: games[0].players[games[0].players.length - 1].name,
      playerIndex: games[0].players.length - 1
    };

    ws.send(JSON.stringify(message));
    console.log("Joining game");
  }

  ws.on ('pong', heartbeat);
  ws.on("close", () => console.log("Client disconnected"));
});

setInterval(() => {
  let numberOfInputsLeft = 0;

  CLIENTS.forEach((element, index) => {
    if (CLIENTS[index].hasSentInput === false) {
      numberOfInputsLeft++;
    }
  });

  if (numberOfInputsLeft === 0) {
    wss.clients.forEach((client, index) => {
      let message = {
        messageType: "SERVERMESSAGE",
        text: "All players did an input!"
      };

      client.send(JSON.stringify(message));

      CLIENTS[index].hasSentInput = false;
    });
  } else {
    wss.clients.forEach((client, index) => {
      if (CLIENTS[index].hasSentInput) {
        let message = {
          messageType: "SERVERMESSAGE",
          text: "Awaiting other players' input..."
        };

        client.send(JSON.stringify(message));
      }
    });
  }
}, 2000);

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
 
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);
