import * as gameData from './gameData.mjs';

export function createPlayer(
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

export function assignPlayerTraits(player) {
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

export function generateFloor(worldData, floorLevel, seed) {
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
    let player = createPlayer(playername, 45, 10, 15, 10, 10, 5, 2, 2);

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

export function createGame() {
  let worldData = { players: [], enemies: [], worldItems: [], worldMap: [] };

  generateWorld(worldData, 1, Math.floor(Math.random() * 1000));

  games.push(worldData);
}