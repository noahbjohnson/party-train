import { GameState, TurnPhase, LegalMove, TurnAction, MAX_CONSECUTIVE_DOUBLES } from '../types.js';
import { getLegalMoves, hasAnyLegalMove, canDrawFromBoneyard } from './RuleEngine.js';
import { playTileOnTrain, satisfyDouble, setTrainOpen } from './Train.js';
import { removeTileFromHand, addTileToHand } from './Player.js';
import { getConnectingSide } from './Tile.js';

export function startTurn(state: GameState): GameState {
  const newState = {
    ...state,
    doublesPlayedThisTurn: 0,
    turnPhase: 'START_TURN' as TurnPhase,
  };

  // Check for unsatisfied double
  if (newState.unsatisfiedDoubleTrainId !== null) {
    return {
      ...newState,
      turnPhase: 'MUST_SATISFY_DOUBLE',
      mustSatisfyDouble: true,
    };
  }

  return {
    ...newState,
    turnPhase: 'PLAY_TILE',
    mustSatisfyDouble: false,
  };
}

export function processPlay(state: GameState, playerId: number, move: LegalMove): GameState {
  const player = state.players[playerId];
  if (!player) throw new Error(`Invalid player ${playerId}`);

  const train = state.trains.get(move.trainId);
  if (!train) throw new Error(`Invalid train ${move.trainId}`);

  // Play the tile on the train
  let updatedTrain = playTileOnTrain(train, move.tile);

  // If we're satisfying a double on a different train, clear it
  if (state.unsatisfiedDoubleTrainId !== null && state.unsatisfiedDoubleTrainId !== move.trainId) {
    const doubledTrain = state.trains.get(state.unsatisfiedDoubleTrainId);
    if (doubledTrain) {
      // The unsatisfied double remains if we played on a different train
      // Actually — satisfying means playing ON the double's train
    }
  }

  // If we played on the train with the unsatisfied double, satisfy it
  let newUnsatisfiedDoubleTrainId = state.unsatisfiedDoubleTrainId;
  if (state.unsatisfiedDoubleTrainId === move.trainId) {
    newUnsatisfiedDoubleTrainId = null;
  }

  // If the played tile is a double, it creates a new unsatisfied double
  if (move.tile.isDouble) {
    newUnsatisfiedDoubleTrainId = move.trainId;
  }

  // Update player hand
  const updatedPlayer = removeTileFromHand(player, move.tile.id);

  // If played on own train and train was open, close it
  if (train.ownerId === playerId && train.isOpen) {
    updatedTrain = setTrainOpen(updatedTrain, false);
  }

  // Build new state
  const newPlayers = [...state.players];
  newPlayers[playerId] = updatedPlayer;

  const newTrains = new Map(state.trains);
  newTrains.set(move.trainId, updatedTrain);

  const doublesThisTurn = state.doublesPlayedThisTurn + (move.tile.isDouble ? 1 : 0);

  // Check if player went out
  if (updatedPlayer.hand.length === 0) {
    return {
      ...state,
      players: newPlayers,
      trains: newTrains,
      unsatisfiedDoubleTrainId: null, // player went out on a double — no need to satisfy
      doublesPlayedThisTurn: doublesThisTurn,
      turnPhase: 'END_TURN',
      roundOver: true,
      turnLog: [...state.turnLog, { type: 'play', playerId, tile: move.tile, trainId: move.trainId, orientation: move.orientation }],
    };
  }

  // Determine next phase
  let nextPhase: TurnPhase;
  if (move.tile.isDouble && doublesThisTurn < MAX_CONSECUTIVE_DOUBLES) {
    nextPhase = 'BONUS_PLAY';
  } else {
    nextPhase = 'END_TURN';
    // If we played a non-double, the new unsatisfied double should be cleared
    if (!move.tile.isDouble) {
      newUnsatisfiedDoubleTrainId = null;
    }
  }

  return {
    ...state,
    players: newPlayers,
    trains: newTrains,
    unsatisfiedDoubleTrainId: newUnsatisfiedDoubleTrainId,
    doublesPlayedThisTurn: doublesThisTurn,
    turnPhase: nextPhase,
    mustSatisfyDouble: false,
    turnLog: [...state.turnLog, { type: 'play', playerId, tile: move.tile, trainId: move.trainId, orientation: move.orientation }],
  };
}

export function processDraw(state: GameState, playerId: number): GameState {
  if (state.boneyard.length === 0) {
    return processMarkTrain(state, playerId);
  }

  const drawnTile = state.boneyard[0]!;
  const remainingBoneyard = state.boneyard.slice(1);

  const player = state.players[playerId];
  if (!player) throw new Error(`Invalid player ${playerId}`);

  const updatedPlayer = addTileToHand(player, drawnTile);
  const newPlayers = [...state.players];
  newPlayers[playerId] = updatedPlayer;

  const newState: GameState = {
    ...state,
    players: newPlayers,
    boneyard: remainingBoneyard,
    turnPhase: 'DREW_TILE',
    turnLog: [...state.turnLog, { type: 'draw', playerId, tile: drawnTile }],
  };

  return newState;
}

export function processDrawnTilePlay(state: GameState, playerId: number): { state: GameState; canPlay: boolean; moves: LegalMove[] } {
  const moves = getLegalMoves(state, playerId);
  if (moves.length > 0) {
    return { state, canPlay: true, moves };
  }
  return { state: processMarkTrain(state, playerId), canPlay: false, moves: [] };
}

export function processMarkTrain(state: GameState, playerId: number): GameState {
  const player = state.players[playerId];
  if (!player) throw new Error(`Invalid player ${playerId}`);

  const train = state.trains.get(player.trainId);
  if (!train) throw new Error(`No train for player ${playerId}`);

  const markedTrain = setTrainOpen(train, true);
  const newTrains = new Map(state.trains);
  newTrains.set(player.trainId, markedTrain);

  // If we failed to satisfy a double, it remains unsatisfied
  return {
    ...state,
    trains: newTrains,
    turnPhase: 'END_TURN',
    turnLog: [...state.turnLog, { type: 'mark', playerId }],
  };
}

export function endTurn(state: GameState): GameState {
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    turnPhase: 'START_TURN',
    mustSatisfyDouble: false,
    doublesPlayedThisTurn: 0,
  };
}
