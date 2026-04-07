import { Train, Tile, PlayedTile } from '../types.js';
import { getConnectingSide, getOtherSide } from './Tile.js';

export function createTrain(id: string, ownerId: number | null, hubValue: number): Train {
  return {
    id,
    ownerId,
    tiles: [],
    openEnd: hubValue,
    isOpen: ownerId === null, // Party Train is always open
    hasUnsatisfiedDouble: false,
  };
}

export function canPlayOnTrain(train: Train, tile: Tile): boolean {
  return tile.sideA === train.openEnd || tile.sideB === train.openEnd;
}

export function playTileOnTrain(train: Train, tile: Tile): Train {
  const side = getConnectingSide(tile, train.openEnd);
  if (side === null) {
    throw new Error(`Tile [${tile.sideA}|${tile.sideB}] cannot connect to train open end ${train.openEnd}`);
  }

  const played: PlayedTile = { tile, orientation: side };
  const newOpenEnd = getOtherSide(tile, side);

  return {
    ...train,
    tiles: [...train.tiles, played],
    openEnd: newOpenEnd,
    hasUnsatisfiedDouble: tile.isDouble,
  };
}

export function satisfyDouble(train: Train): Train {
  return {
    ...train,
    hasUnsatisfiedDouble: false,
  };
}

export function setTrainOpen(train: Train, isOpen: boolean): Train {
  return {
    ...train,
    isOpen,
  };
}
