import { GameState, LegalMove, Tile, Train } from '../types.js';
import { getConnectingSide } from './Tile.js';

export function getLegalMoves(state: GameState, playerId: number): LegalMove[] {
  const player = state.players[playerId];
  if (!player) return [];

  const eligibleTrains = getEligibleTrains(state, playerId);
  const moves: LegalMove[] = [];

  for (const train of eligibleTrains) {
    for (const tile of player.hand) {
      const orientation = getConnectingSide(tile, train.openEnd);
      if (orientation !== null) {
        moves.push({ tile, trainId: train.id, orientation });
      }
    }
  }

  return moves;
}

export function getEligibleTrains(state: GameState, playerId: number): Train[] {
  // If there's an unsatisfied double, only that train is eligible
  if (state.mustSatisfyDouble && state.unsatisfiedDoubleTrainId !== null) {
    const train = state.trains.get(state.unsatisfiedDoubleTrainId);
    return train ? [train] : [];
  }

  const eligible: Train[] = [];

  for (const train of state.trains.values()) {
    if (isTrainEligible(train, playerId)) {
      eligible.push(train);
    }
  }

  return eligible;
}

function isTrainEligible(train: Train, playerId: number): boolean {
  // Own train — always eligible
  if (train.ownerId === playerId) return true;
  // Party Train — always eligible
  if (train.ownerId === null) return true;
  // Other player's train — only if marked open
  return train.isOpen;
}

export function isValidPlay(state: GameState, playerId: number, tileId: number, trainId: string): boolean {
  const moves = getLegalMoves(state, playerId);
  return moves.some(m => m.tile.id === tileId && m.trainId === trainId);
}

export function getMovesForTile(state: GameState, playerId: number, tileId: number): LegalMove[] {
  return getLegalMoves(state, playerId).filter(m => m.tile.id === tileId);
}

export function getMovesForTrain(state: GameState, playerId: number, trainId: string): LegalMove[] {
  return getLegalMoves(state, playerId).filter(m => m.trainId === trainId);
}

export function hasAnyLegalMove(state: GameState, playerId: number): boolean {
  return getLegalMoves(state, playerId).length > 0;
}

export function canDrawFromBoneyard(state: GameState): boolean {
  return state.boneyard.length > 0;
}

export function areAllPlayersBlocked(state: GameState): boolean {
  if (state.boneyard.length > 0) return false;
  return state.players.every((_, i) => !hasAnyLegalMove(state, i));
}
