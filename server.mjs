"use strict";

const express = require("express");
const SocketServer = require("ws").Server;
const path = require("path");

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, "index.html");

const server = express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new SocketServer({ server, clientTracking: true });

import {createPlayer} from './generation.mjs';
import {assignPlayerTraits} from './generation.mjs';
import {createGame} from './generation.mjs';


const CLIENTS = [];

let games = [];

let gameData = {
  randomPlayerNames: [
    "Bob Ross",
    "Dorian",
    "Dink",
    "Donk",
    "Dunk",
    "Dank",
    "Joe",
    "Heather",
    "Dylan",
    "Bartholemeu",
    "Jack",
    "Gertrude",
    "Stanley",
    "Stuart",
    "Pope Frank",
    "Yoda",
    "Rey",
    "Grendel",
    "Watson",
    "Frodo",
    "Dawn of the Round Trees",
    "Mrs. Frizzle",
    "Richard Milhouse Nixon",
    "Henry VIII",
    "Napoleon",
    "Franco",
    "Abraham Lincoln",
    "Huey Long",
    "Neville Chamberlain",
    "Zelda",
    "Peach",
    "Mayro",
    "Luigi",
    "Alexander",
    "Bad Hombre",
    "Batman",
    "JC Denton",
    "Walton Simons",
    "Jonathan",
    "Cloud",
    "Waluigi",
    "Kirby",
    "Bismarck",
    "Gandalf",
    "Gary Oak",
    "Indiana Jones",
    "James Government-issued Bond",
    "Ronald Drumpf",
    "Spock",
    "Dumbledore",
    "Bill Gates",
    "Sir Sconius",
    "Thomas Testingham Trousers III",
    "Elmo",
    "Furby",
    "Spongebob",
    "Vladimir Putin",
    "Kim jong un",
    "Barack Obama",
    "Bill Clinton",
    "Hillary Clinton"
  ],

  positiveTraits: [
    {
      name: "Formidable",
      defenseModifier: 0.33,
      incompatibleTraits: ["Weak"]
    },
    {
      name: "Wise",
      manaModifier: 0.33,
      incompatibleTraits: ["Stupid"]
    },
    {
      name: "Curious",
      experienceModifier: 0.25,
      incompatibleTraits: ["default"]
    },
    {
      name: "Restless",
      staminaModifier: 0.15,
      incompatibleTraits: ["Unathletic"]
    },
    {
      name: "Healthy",
      healthModifier: 0.15,
      incompatibleTraits: ["Sickly"]
    },
    {
      name: "Focused",
      criticalHitModifier: 7,
      incompatibleTraits: ["default"]
    }
  ],

  negativeTraits: [
    {
      name: "Unathletic",
      staminaModifier: -0.25
    },
    {
      name: "Stupid",
      manaModifier: -0.75
    },
    {
      name: "Cowardly",
      attackModifier: -0.33
    },
    {
      name: "Sickly",
      healthModifier: -0.33
    },
    {
      name: "Weak",
      defenseModifier: -0.33
    }
  ],

  tileDescriptions: [
    {
      identifier: "emptyroom",
      description: "an empty room with a cobblestone floor."
    },
    {
      identifier: "emptyroom",
      description: "an empty room with a dirt floor."
    },
    {
      identifier: "emptyroom",
      description:
        "an empty room with a sand floor. Your feet keep sinking into the sand, and some sand trickles down from the ceiling."
    },
    {
      identifier: "emptyroom",
      description: "an empty room with a brick floor."
    },
    {
      identifier: "emptyroom",
      description:
        "an empty room with a grassy floor. Strange plants are growing in the room."
    },
    {
      identifier: "wall",
      description: "a cobblestone wall covered in moss."
    },
    {
      identifier: "wall",
      description: "a clay brick wall."
    },
    {
      identifier: "wall",
      description: "a sandstone wall. It has strange symbols written on it."
    },
    {
      identifier: "wall",
      description:
        "a cobblestone wall. It has a picture of a giant eye engraved in it."
    },
    {
      identifier: "wall",
      description: "a rock wall. Small crystals glow on the wall."
    },
    {
      identifier: "wall",
      description:
        "a dirt wall, with rotting wooden beams holding up the ceiling."
    }
  ],

  gameItems: [
    {
      identifier: "startingdagger",
      name: "Dagger",
      attackValue: 3,
      criticalHitBonus: 5,
      equipmentType: "weapon",
      description: "A short dagger",
      minimumfloor: 1,
      maximumfloor: 3,
    },
    {
      identifier: "startingsword",
      name: "Sword",
      attackValue: 5,
      equipmentType: "weapon",
      description: "A sword",
      minimumfloor: 1,
      maximumfloor: 3,
    },
    {
      identifier: "startingwand",
      name: "Wand",
      ManaValue: 4,
      equipmentType: "weapon",
      description: "A wand that looks like it's made of plastic",
      minimumfloor: 1,
      maximumfloor: 3,
    },
    {
      identifier: "witherdagger",
      name: "Wither Dagger",
      attackValue: 5,
      ManaValue: 6,
      criticalHitBonus: 15,
      equipmentType: "weapon",
      description: "A deadly dagger that deals some damage back to you",
      minimumfloor: 4,
      maximumfloor: 6,
    },
    {
      identifier: "vitalitydagger",
      name: "Vitality Dagger",
      attackValue: 3,
      healthValue: 16,
      equipmentType: "weapon",
      description:
        "A dagger that makes you feel healthier....maybe it's a placebo",
        minimumfloor: 4,
        maximumfloor: 6,
    },
    {
      identifier: "silverdagger",
      name: "Silver Dagger",
      attackValue: 5,
      criticalHitBonus: 8,
      equipmentType: "weapon",
      description: "A silver dagger, made in China",
      minimumfloor: 4,
      maximumfloor: 6,
    },
    {
      identifier: "beastclaw",
      name: "Beast Claw",
      attackValue: 6,
      criticalHitBonus: 6,
      equipmentType: "weapon",
      description:
        "A beast's claw. You think it came from an evil monster, like a telemarketer",
        minimumfloor: 4,
        maximumfloor: 6,
    },
    {
      identifier: "talon",
      name: "Talon",
      attackValue: 8,
      criticalHitBonus: 13,
      equipmentType: "weapon",
      description: "An assassin's favorite, sharp to the touch",
      minimumfloor: 7,
      maximumfloor: 9,
    },
    {
      identifier: "manadagger",
      name: "Mana Dagger",
      attackValue: 6,
      ManaValue: 19,
      equipmentType: "weapon",
      description: "A glowing dagger that boosts your mana energy",
      minimumfloor: 7,
      maximumfloor: 9,
    },
    {
      identifier: "nexusdagger",
      name: "Nexus Dagger",
      attackValue: 6,
      healthValue: -50,
      ManaValue: 66,
      equipmentType: "weapon",
      description:
        "An obsidian dagger that takes away your life, like school but less subtly",
        minimumfloor: 7,
        maximumfloor: 9,
    },
    {
      identifier: "staminadagger",
      name: "Enduran",
      attackValue: -5,
      healthValue: 15,
      criticalHitBonus: 1,
      equipmentType: "weapon",
      description:
        "A lightweight dagger that boosts your endurance, because you're lazy",
        minimumfloor: 7,
        maximumfloor: 9,
    },
    {
      identifier: "twinblades",
      name: "Twin Blades",
      attackValue: 13,
      criticalHitBonus: 10,
      equipmentType: "weapon",
      description:
        "Blades of legend that belonged to two ancient cowards. Reading the enscription, you can tell they belonging to France and Italy",
        minimumfloor: 7,
        maximumfloor: 9,
    },
    {
      identifier: "machete",
      name: "Machete",
      attackValue: 7,
      equipmentType: "weapon",
      description: "A machete",
      minimumfloor: 4,
      maximumfloor: 6,
    },
    {
      identifier: "katana",
      name: "Katana",
      attackValue: 5,
      criticalHitBonus: 4,
      equipmentType: "weapon",
      description: "A sword used by an ancient race of outcasts called 'Weeaboos'",
      minimumfloor: 4,
      maximumfloor: 6,
    },
    {
      identifier: "cutlass",
      name: "Cutlass",
      attackValue: 6,
      equipmentType: "weapon",
      description: "ARRRRRGHHHH!",
      minimumfloor: 4,
      maximumfloor: 6,
    },
    {
      identifier: "broadsword",
      name: "Broadsword",
      attackValue: 7,
      defenseValue: 3,
      equipmentType: "weapon",
      description: "A plus-size sword, because even weapons need equality",
      minimumfloor: 4,
      maximumfloor: 6,
    },
    {
      identifier: "biosword",
      name: "Bio Sword",
      attackValue: 8,
      healthValue: 26,
      equipmentType: "weapon",
      description: "Makes you healthier",
      minimumfloor: 7,
      maximumfloor: 9,
    },
    {
      identifier: "manasword",
      name: "Mana Sword",
      attackValue: 8,
      equipmentType: "weapon",
      description: "Stardust shimmers off of the sword. Remember, don't snort the stardust, drugs are bad",
      minimumfloor: 7,
      maximumfloor: 9,
    },   
    {
      identifier: "glasssword",
      name: "Glass Sword",
      attackValue: 16,
      healthValue: -60,
      defenseValue: -15,
      criticalHitBonus: 10,
      equipmentType: "weapon",
      description: "Your attack becomes really strong with this sword, but you become weak",
      minimumfloor: 7,
      maximumfloor: 9,
    },
    {
      identifier: "excalibur",
      name: "Excalibur",
      attackValue: 14,
      equipmentType: "weapon",
      description: "The sword of legend",
      minimumfloor: 7,
      maximumfloor: 9,
    },
  ]
};

wss.on("connection", function connection(ws, req) {
  CLIENTS.push(ws);

  if (games.length === 0) {

    createGame ();

    wss.clients.forEach(client => {
      let message = {
        messageType: "NAME",
        name: games [0].players [0].name
      }
  
      client.send(JSON.stringify(message)); console.log ("Creating new game");
    });

  } else {

    let randomIndex = Math.floor(
      Math.random() * Math.floor(gameData.randomPlayerNames.length)
    );
    let playername = gameData.randomPlayerNames[randomIndex];
    let player = createPlayer(playername, 45, 10, 15, 10, 10, 5, 2, 2);

    assignPlayerTraits(player);

    games [0].players.push(player);

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
      name: games [0].players [games [0].players.length-1].name
    }

    ws.send(JSON.stringify(message)); console.log ("Joining game");

  }

  ws.on("close", () =>
    console.log(
      "Client disconnected"
    )
  );
});

setInterval(() => {
  wss.clients.forEach(client => {
    let message = {
      messageType: "DATE",
      date: new Date().toTimeString()
    };

    client.send(JSON.stringify(message));
  });
}, 1000);
