import { Player, Tile, SortMode } from '../types.js';
import { removeTile } from './TileSet.js';

export function createPlayer(id: number, name: string, isHuman: boolean): Player {
  return {
    id,
    name,
    hand: [],
    isHuman,
    trainId: `player-${id}`,
    score: 0,
    roundScore: 0,
  };
}

export function dealToPlayer(player: Player, tiles: Tile[]): Player {
  return {
    ...player,
    hand: [...player.hand, ...tiles],
  };
}

export function removeTileFromHand(player: Player, tileId: number): Player {
  return {
    ...player,
    hand: removeTile(player.hand, tileId),
  };
}

export function addTileToHand(player: Player, tile: Tile): Player {
  return {
    ...player,
    hand: [...player.hand, tile],
  };
}

export function calculateRoundScore(player: Player): number {
  return player.hand.reduce((sum, t) => sum + t.pipCount, 0);
}

export function sortHand(hand: Tile[], mode: SortMode): Tile[] {
  const sorted = [...hand];
  switch (mode) {
    case 'left':
      return sorted.sort((a, b) => a.sideA - b.sideA || a.sideB - b.sideB);
    case 'right':
      return sorted.sort((a, b) => a.sideB - b.sideB || a.sideA - b.sideA);
    case 'total':
      return sorted.sort((a, b) => b.pipCount - a.pipCount);
    case 'color':
      return sorted.sort((a, b) => a.sideA - b.sideA);
  }
}
