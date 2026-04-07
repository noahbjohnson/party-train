import { Tile, MAX_PIP, TOTAL_TILES } from '../types.js';
import { createTile } from './Tile.js';

export function generateFullSet(): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;
  for (let a = 0; a <= MAX_PIP; a++) {
    for (let b = a; b <= MAX_PIP; b++) {
      tiles.push(createTile(id++, a, b));
    }
  }
  return tiles;
}

export function shuffleTiles(tiles: Tile[]): Tile[] {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export function findTileById(tiles: Tile[], id: number): Tile | undefined {
  return tiles.find(t => t.id === id);
}

export function removeTile(tiles: Tile[], tileId: number): Tile[] {
  return tiles.filter(t => t.id !== tileId);
}

export function findDouble(tiles: Tile[], value: number): Tile | undefined {
  return tiles.find(t => t.isDouble && t.sideA === value);
}
