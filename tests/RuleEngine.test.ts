import { describe, it, expect } from 'vitest';
import { getLegalMoves, getEligibleTrains, hasAnyLegalMove, areAllPlayersBlocked } from '../src/game/RuleEngine.js';
import { createTrain } from '../src/game/Train.js';
import { createTile } from '../src/game/Tile.js';
import { createPlayer, dealToPlayer } from '../src/game/Player.js';
import { GameState, Train, Player } from '../src/types.js';

function makeState(overrides: Partial<GameState> & { players: Player[]; trains: Map<string, Train> }): GameState {
  return {
    round: 0,
    hubValue: 12,
    boneyard: [],
    currentPlayerIndex: 0,
    turnPhase: 'PLAY_TILE',
    unsatisfiedDoubleTrainId: null,
    doublesPlayedThisTurn: 0,
    mustSatisfyDouble: false,
    roundOver: false,
    gameOver: false,
    winnerId: null,
    turnLog: [],
    ...overrides,
  };
}

describe('RuleEngine', () => {
  it('should return legal moves for own train', () => {
    const player = dealToPlayer(createPlayer(0, 'Test', true), [
      createTile(0, 5, 12),
      createTile(1, 3, 7),
    ]);

    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    trains.set('party', createTrain('party', null, 12));

    const state = makeState({ players: [player], trains });
    const moves = getLegalMoves(state, 0);

    // Tile [5|12] should be playable on player-0 (openEnd 12) and party (openEnd 12)
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.some(m => m.tile.id === 0 && m.trainId === 'player-0')).toBe(true);
  });

  it('should allow play on Party Train', () => {
    const player = dealToPlayer(createPlayer(0, 'Test', true), [
      createTile(0, 5, 12),
    ]);

    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    trains.set('party', createTrain('party', null, 12));

    const state = makeState({ players: [player], trains });
    const moves = getLegalMoves(state, 0);

    expect(moves.some(m => m.trainId === 'party')).toBe(true);
  });

  it('should allow play on open opponent train', () => {
    const player = dealToPlayer(createPlayer(0, 'Test', true), [
      createTile(0, 5, 12),
    ]);

    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    const oppTrain = createTrain('player-1', 1, 12);
    trains.set('player-1', { ...oppTrain, isOpen: true });
    trains.set('party', createTrain('party', null, 12));

    const state = makeState({ players: [player, createPlayer(1, 'Opp', false)], trains });
    const moves = getLegalMoves(state, 0);

    expect(moves.some(m => m.trainId === 'player-1')).toBe(true);
  });

  it('should block play on closed opponent train', () => {
    const player = dealToPlayer(createPlayer(0, 'Test', true), [
      createTile(0, 5, 12),
    ]);

    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    trains.set('player-1', createTrain('player-1', 1, 12)); // closed
    trains.set('party', createTrain('party', null, 12));

    const state = makeState({ players: [player, createPlayer(1, 'Opp', false)], trains });
    const moves = getLegalMoves(state, 0);

    expect(moves.some(m => m.trainId === 'player-1')).toBe(false);
  });

  it('should force satisfaction of unsatisfied double', () => {
    const player = dealToPlayer(createPlayer(0, 'Test', true), [
      createTile(0, 5, 12),
      createTile(1, 3, 7),
    ]);

    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    const partyTrain = { ...createTrain('party', null, 7), hasUnsatisfiedDouble: true };
    trains.set('party', partyTrain);

    const state = makeState({
      players: [player],
      trains,
      mustSatisfyDouble: true,
      unsatisfiedDoubleTrainId: 'party',
    });

    const moves = getLegalMoves(state, 0);

    // Only moves on party train should be legal
    expect(moves.every(m => m.trainId === 'party')).toBe(true);
    expect(moves.some(m => m.tile.id === 1)).toBe(true); // [3|7] matches party openEnd 7
  });

  it('should return empty for no legal moves', () => {
    const player = dealToPlayer(createPlayer(0, 'Test', true), [
      createTile(0, 1, 2), // no 12 or matching value
    ]);

    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    trains.set('party', createTrain('party', null, 12));

    const state = makeState({ players: [player], trains });
    const moves = getLegalMoves(state, 0);

    expect(moves).toHaveLength(0);
  });

  it('should detect when all players are blocked', () => {
    const p0 = dealToPlayer(createPlayer(0, 'A', false), [createTile(0, 1, 2)]);
    const p1 = dealToPlayer(createPlayer(1, 'B', false), [createTile(1, 3, 4)]);

    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    trains.set('player-1', createTrain('player-1', 1, 12));
    trains.set('party', createTrain('party', null, 12));

    const state = makeState({ players: [p0, p1], trains, boneyard: [] });
    expect(areAllPlayersBlocked(state)).toBe(true);
  });

  it('should not be blocked if boneyard has tiles', () => {
    const p0 = dealToPlayer(createPlayer(0, 'A', false), [createTile(0, 1, 2)]);

    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    trains.set('party', createTrain('party', null, 12));

    const state = makeState({
      players: [p0],
      trains,
      boneyard: [createTile(50, 6, 12)],
    });
    expect(areAllPlayersBlocked(state)).toBe(false);
  });
});
