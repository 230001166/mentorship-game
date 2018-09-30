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

const CLIENTS = [];

let games = [];

function createPlayer(
  name,
  health,
  mana,
  stamina,
  strength,
  defense,
  criticalChance,
  positionRow,
  positionCol
) {
  return {
    name,
    health,
    maxHealth: health,
    mana,
    maxMana: mana,
    stamina,
    maxStamina: stamina,
    strength,
    defense,
    criticalChance,
    experience: 0,
    level: 1,
    positionRow,
    positionCol
  };
}

function traitIsNotIncompatible(player, traitIndex) {
  for (
    let i = 0;
    i < gameData.positiveTraits[traitIndex].incompatibleTraits.length;
    i++
  ) {
    if (
      gameData.positiveTraits[traitIndex].incompatibleTraits[i] ==
      player.negativeTrait.name
    ) {
      return false;
    }
  }

  return true;
}

function assignPlayerTraits(player) {
  const NEGATIVE_TRAITS = 5,
    POSITIVE_TRAITS = 6;

  let randomNumber = Math.floor(Math.random() * Math.floor(NEGATIVE_TRAITS));

  player.negativeTrait = gameData.negativeTraits[randomNumber];

  let positiveTraitIsValid = false;

  while (!positiveTraitIsValid) {
    randomNumber = Math.floor(Math.random() * Math.floor(POSITIVE_TRAITS));

    if (traitIsNotIncompatible(player, randomNumber)) {
      player.positiveTrait = gameData.positiveTraits[randomNumber];
      positiveTraitIsValid = true;
    }
  }

  let healthModifier =
    1.0 +
    player.positiveTrait.healthModifier +
    player.negativeTrait.healthModifier;

  player.maxHealth *= healthModifier;
  player.health = player.maxHealth; console.log (healthModifier + " health Modifier");

  let attackModifier =
    1.0 +
    player.positiveTrait.attackModifier +
    player.negativeTrait.attackModifier;

  player.strength *= attackModifier;

  let defenseModifier =
    1.0 +
    player.positiveTrait.defenseModifier +
    player.negativeTrait.defenseModifier;

  player.defense *= defenseModifier;

  let staminaModifier =
    1.0 +
    player.positiveTrait.staminaModifier +
    player.negativeTrait.staminaModifier;

  player.maxStamina *= staminaModifier;
  player.stamina = player.maxStamina;

  let manaModifier =
    1.0 + player.positiveTrait.manaModifier + player.negativeTrait.manaModifier;

  player.maxMana *= manaModifier;
  player.health = player.maxMana;
}

function isEmptySpaceClump(worldData, row, col) {
  let emptySpaceClumpExists = false,
    emptySpaces = 0;

  if (row >= 0 && row < 4 && col >= 0 && col < 4) {
    if (worldData.worldMap[row + col * 5].identifier === "emptyroom") {
      emptySpaces++;
    }
    if (worldData.worldMap[row + 1 + col * 5].identifier === "emptyroom") {
      emptySpaces++;
    }
    if (worldData.worldMap[row + (col + 1) * 5].identifier === "emptyroom") {
      emptySpaces++;
    }
    if (
      worldData.worldMap[row + 1 + (col + 1) * 5].identifier === "emptyroom"
    ) {
      emptySpaces++;
    }

    if (emptySpaces >= 3) {
      emptySpaceClumpExists = true;
    }
  }

  return emptySpaceClumpExists;
}

function removingTileIsNotValid(worldData, row, col) {
  let emptySpaceClumpExists = false;

  for (let i = -1; i < 1; i++) {
    for (let j = -1; j < 1; j++) {
      if (isEmptySpaceClump(worldData, row + i, col + j)) {
        emptySpaceClumpExists = true;
      }
    }
  }

  return emptySpaceClumpExists;
}

function tileIsSurroundedByWalls(worldData, row, col) {
  let surroundingTiles = 0;

  if (
    row - 1 < 0 ||
    worldData.worldMap[row - 1 + col * 5].identifier === "wall"
  ) {
    surroundingTiles++;
  }
  if (
    row + 1 > 4 ||
    worldData.worldMap[row + 1 + col * 5].identifier === "wall"
  ) {
    surroundingTiles++;
  }
  if (
    col - 1 < 0 ||
    worldData.worldMap[row + (col - 1) * 5].identifier === "wall"
  ) {
    surroundingTiles++;
  }
  if (
    col + 1 > 4 ||
    worldData.worldMap[row + (col + 1) * 5].identifier === "wall"
  ) {
    surroundingTiles++;
  }

  if (surroundingTiles === 4) {
    return true;
  } else {
    return false;
  }
}

function generateFloor(worldData, floorLevel, seed) {
  if (floorLevel <= 3) {
    for (let i = 0; i < 25; i++) {
      /// 5 x 5 tilemap, generate 25 tiles

      let tile = {
        identifier: "wall",
        position: { row: i % 5, col: Math.floor(i / 5) }
      };

      worldData.worldMap.push(tile);
    }

    let centerRow = 2,
      centerCol = 2;

    worldData.worldMap[centerRow + centerCol * 5].identifier = "emptyroom";

    let wallClumpsRemain = true;
    while (wallClumpsRemain) {
      console.log("branching...");
      for (let a = 0; a < 2; a++) {
        let x = 0,
          y = 0,
          positionIsValid = false;

        while (!positionIsValid) {
          x = Math.floor(Math.random() * Math.floor(5));
          y = Math.floor(Math.random() * Math.floor(5));

          if (worldData.worldMap[x + y * 5].identifier === "emptyroom") {
            positionIsValid = true;
          }
        }

        let xOffset = 0,
          yOffset = 0;

        while (xOffset == 0 || (x + xOffset < 0 || x + xOffset > 4)) {
          xOffset = Math.floor(Math.random() * Math.floor(5)) - 2;
        }
        while (yOffset == 0 || (y + yOffset < 0 || y + yOffset > 4)) {
          yOffset = Math.floor(Math.random() * Math.floor(5)) - 2;
        }

        for (let i = 0; i < Math.abs(xOffset); i++) {
          if (
            xOffset < 0 &&
            x - i >= 0 &&
            !removingTileIsNotValid(worldData, x - (i + 1), y) &&
            !tileIsSurroundedByWalls(worldData, x - (i + 1), y)
          ) {
            worldData.worldMap[x - (i + 1) + y * 5].identifier = "emptyroom";
          }

          if (
            xOffset > 0 &&
            x + i <= 4 &&
            !removingTileIsNotValid(worldData, x + i + 1, y) &&
            !tileIsSurroundedByWalls(worldData, x + i + 1, y)
          ) {
            worldData.worldMap[x + i + 1 + y * 5].identifier = "emptyroom";
          }
        }

        for (let i = 0; i < Math.abs(yOffset); i++) {
          if (
            yOffset < 0 &&
            y - i >= 0 &&
            !removingTileIsNotValid(worldData, x, y - (i + 1)) &&
            !tileIsSurroundedByWalls(worldData, x, y - (i + 1))
          ) {
            worldData.worldMap[x + (y - (i + 1)) * 5].identifier = "emptyroom";
          }

          if (
            yOffset > 0 &&
            y + i <= 4 &&
            !removingTileIsNotValid(worldData, x, y + i + 1) &&
            !tileIsSurroundedByWalls(worldData, x, y + i + 1)
          ) {
            worldData.worldMap[x + (y + i + 1) * 5].identifier = "emptyroom";
          }
        }
      }

      wallClumpsRemain = false;

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (
            worldData.worldMap[i + j * 5].identifier === "wall" &&
            worldData.worldMap[i + 1 + j * 5].identifier === "wall" &&
            worldData.worldMap[i + (j + 1) * 5].identifier === "wall" &&
            worldData.worldMap[i + 1 + (j + 1) * 5].identifier === "wall"
          ) {
            wallClumpsRemain = true;
          }
        }
      }
    }
  }
}

function generateWorld(worldData, numberOfPlayers, seed) {
  for (let i = 0; i < numberOfPlayers; i++) {
    let randomIndex = Math.floor(
      Math.random() * Math.floor(gameData.randomPlayerNames.length)
    );
    let playername = gameData.randomPlayerNames[randomIndex];
    let player = createPlayer(playername, 60, 15, 15, 10, 10, 5, 2, 2);

    assignPlayerTraits(player);

    worldData.players.push(player);

    console.log(
      "Generated " +
        player.name +
        " the " +
        player.negativeTrait.name +
        " yet " +
        player.positiveTrait.name
    );
  }

  generateFloor(worldData, 1, seed);
}

function createGame() {
  let worldData = { players: [], enemies: [], worldItems: [], worldMap: [] };

  generateWorld(worldData, 1, Math.floor(Math.random() * 1000));

  games.push(worldData);
}

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
    "Ruff Ruffman",
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

      healthModifier: 0.0,
      attackModifier: 0.0,
      staminaModifier: 0.0,
      manaModifier: 0.0,
      incompatibleTraits: ["Weak"]
    },
    {
      name: "Wise",
      manaModifier: 0.33,

      healthModifier: 0.0,
      attackModifier: 0.0,
      defenseModifier: 0.0,
      staminaModifier: 0.0,
      incompatibleTraits: ["Stupid"]
    },
    {
      name: "Curious",
      experienceModifier: 0.25,

      healthModifier: 0.0,
      attackModifier: 0.0,
      defenseModifier: 0.0,
      staminaModifier: 0.0,
      manaModifier: 0.0,
      incompatibleTraits: ["default"]
    },
    {
      name: "Restless",
      staminaModifier: 0.15,

      healthModifier: 0.0,
      attackModifier: 0.0,
      defenseModifier: 0.0,
      manaModifier: 0.0,
      incompatibleTraits: ["Unathletic"]
    },
    {
      name: "Healthy",
      healthModifier: 0.15,

      attackModifier: 0.0,
      defenseModifier: 0.0,
      staminaModifier: 0.0,
      manaModifier: 0.0,
      incompatibleTraits: ["Sickly"]
    },
    {
      name: "Focused",
      criticalHitModifier: 7,

      healthModifier: 0.0,
      attackModifier: 0.0,
      defenseModifier: 0.0,
      staminaModifier: 0.0,
      manaModifier: 0.0,
      incompatibleTraits: ["default"]
    }
  ],

  negativeTraits: [
    {
      name: "Unathletic",
      staminaModifier: -0.25,

      healthModifier: 0.0,
      attackModifier: 0.0,
      defenseModifier: 0.0,
      manaModifier: 0.0
    },
    {
      name: "Stupid",
      manaModifier: -0.75,

      healthModifier: 0.0,
      attackModifier: 0.0,
      defenseModifier: 0.0,
      staminaModifier: 0.0
    },
    {
      name: "Cowardly",
      attackModifier: -0.33,

      healthModifier: 0.0,
      defenseModifier: 0.0,
      staminaModifier: 0.0,
      manaModifier: 0.0
    },
    {
      name: "Sickly",
      healthModifier: -0.33,

      attackModifier: 0.0,
      defenseModifier: 0.0,
      staminaModifier: 0.0,
      manaModifier: 0.0
    },
    {
      name: "Weak",
      defenseModifier: -0.33,

      healthModifier: 0.0,
      attackModifier: 0.0,
      staminaModifier: 0.0,
      manaModifier: 0.0
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
      maximumfloor: 3
    },
    {
      identifier: "startingsword",
      name: "Sword",
      attackValue: 5,
      equipmentType: "weapon",
      description: "A sword",
      minimumfloor: 1,
      maximumfloor: 3
    },
    {
      identifier: "startingwand",
      name: "Wand",
      ManaValue: 4,
      equipmentType: "weapon",
      description: "A wand that looks like it's made of plastic",
      minimumfloor: 1,
      maximumfloor: 3
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
      maximumfloor: 6
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
      maximumfloor: 6
    },
    {
      identifier: "silverdagger",
      name: "Silver Dagger",
      attackValue: 5,
      criticalHitBonus: 8,
      equipmentType: "weapon",
      description: "A silver dagger, made in China",
      minimumfloor: 4,
      maximumfloor: 6
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
      maximumfloor: 6
    },
    {
      identifier: "talon",
      name: "Talon",
      attackValue: 8,
      criticalHitBonus: 13,
      equipmentType: "weapon",
      description: "An assassin's favorite, sharp to the touch",
      minimumfloor: 7,
      maximumfloor: 9
    },
    {
      identifier: "manadagger",
      name: "Mana Dagger",
      attackValue: 6,
      ManaValue: 19,
      equipmentType: "weapon",
      description: "A glowing dagger that boosts your mana energy",
      minimumfloor: 7,
      maximumfloor: 9
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
      maximumfloor: 9
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
      maximumfloor: 9
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
      maximumfloor: 9
    },
    {
      identifier: "machete",
      name: "Machete",
      attackValue: 7,
      equipmentType: "weapon",
      description: "A machete",
      minimumfloor: 4,
      maximumfloor: 6
    },
    {
      identifier: "katana",
      name: "Katana",
      attackValue: 5,
      criticalHitBonus: 4,
      equipmentType: "weapon",
      description:
        "A sword used by an ancient race of outcasts called 'Weeaboos'",
      minimumfloor: 4,
      maximumfloor: 6
    },
    {
      identifier: "cutlass",
      name: "Cutlass",
      attackValue: 6,
      equipmentType: "weapon",
      description: "ARRRRRGHHHH!",
      minimumfloor: 4,
      maximumfloor: 6
    },
    {
      identifier: "broadsword",
      name: "Broadsword",
      attackValue: 7,
      defenseValue: 3,
      equipmentType: "weapon",
      description: "A plus-size sword, because even weapons need equality",
      minimumfloor: 4,
      maximumfloor: 6
    },
    {
      identifier: "biosword",
      name: "Bio Sword",
      attackValue: 8,
      healthValue: 26,
      equipmentType: "weapon",
      description: "Makes you healthier",
      minimumfloor: 7,
      maximumfloor: 9
    },
    {
      identifier: "manasword",
      name: "Mana Sword",
      attackValue: 8,
      equipmentType: "weapon",
      description:
        "Stardust shimmers off of the sword. Remember, don't snort the stardust, drugs are bad",
      minimumfloor: 7,
      maximumfloor: 9
    },
    {
      identifier: "glasssword",
      name: "Glass Sword",
      attackValue: 16,
      healthValue: -60,
      defenseValue: -15,
      criticalHitBonus: 10,
      equipmentType: "weapon",
      description:
        "Your attack becomes really strong with this sword, but you become weak",
      minimumfloor: 7,
      maximumfloor: 9
    },
    {
      identifier: "excalibur",
      name: "Excalibur",
      attackValue: 14,
      equipmentType: "weapon",
      description: "The sword of legend",
      minimumfloor: 7,
      maximumfloor: 9
    }
  ]
};

function disconnectClient(index) {
  CLIENTS.splice(index, 1);
  games[0].players.splice(index, 1);
}

function returnIndexFromUniqueIdentifier(ws) {
  CLIENTS.forEach((client, index) => {
    console.log(client.uniqueIdentifier + " " + ws.uniqueIdentifier);
    if (client.uniqueIdentifier == ws.uniqueIdentifier) {
      console.log("Match!");
      return index;
    }
  });

  return 0;
}

wss.on("connection", function connection(ws, req) {
  ws.uniqueIdentifier = Math.floor(Math.random() * Math.floor(1000000));

  CLIENTS.push(ws);
  CLIENTS[CLIENTS.length - 1].hasSentInput = false;

  ws.onmessage = function(event) {
    CLIENTS[event.data].hasSentInput = true;
  };

  if (games.length === 0) {
    createGame();

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
    let player = createPlayer(playername, 45, 10, 15, 10, 10, 5, 2, 2);

    assignPlayerTraits(player);

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

  ws.on("close", () => {
    console.log(
      "client " + returnIndexFromUniqueIdentifier(ws) + " disconnected"
    );
    disconnectClient(returnIndexFromUniqueIdentifier(ws));
  });
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

  wss.clients.forEach((client, index) => {
    let message = {
      messageType: "PLAYERDATA",
      data: games[0].players[index]
    };

    client.send(JSON.stringify(message));
  });

}, 1000);
