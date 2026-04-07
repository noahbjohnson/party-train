import { Tile, MAX_PIP } from '../types.js';

export function createTile(id: number, sideA: number, sideB: number): Tile {
  const lo = Math.min(sideA, sideB);
  const hi = Math.max(sideA, sideB);
  return {
    id,
    sideA: lo,
    sideB: hi,
    isDouble: lo === hi,
    pipCount: lo + hi,
  };
}

export function tileMatchesValue(tile: Tile, value: number): boolean {
  return tile.sideA === value || tile.sideB === value;
}

export function getConnectingSide(tile: Tile, value: number): 'normal' | 'flipped' | null {
  if (tile.sideA === value) return 'normal';
  if (tile.sideB === value) return 'flipped';
  return null;
}

export function getOtherSide(tile: Tile, connectingSide: 'normal' | 'flipped'): number {
  return connectingSide === 'normal' ? tile.sideB : tile.sideA;
}

export function tileToString(tile: Tile): string {
  return `[${tile.sideA}|${tile.sideB}]`;
}
