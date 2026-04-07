import { describe, it, expect } from 'vitest';
import { startTurn, processPlay, processDraw, processMarkTrain, endTurn } from '../src/game/TurnManager.js';
import { createTrain } from '../src/game/Train.js';
import { createTile } from '../src/game/Tile.js';
import { createPlayer, dealToPlayer } from '../src/game/Player.js';
import { GameState, Train, Player, LegalMove } from '../src/types.js';

function makeState(overrides: Partial<GameState> & { players: Player[]; trains: Map<string, Train> }): GameState {
  return {
    round: 0,
    hubValue: 12,
    boneyard: [],
    currentPlayerIndex: 0,
    turnPhase: 'START_TURN',
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

describe('TurnManager', () => {
  it('should transition to PLAY_TILE when no unsatisfied double', () => {
    const player = dealToPlayer(createPlayer(0, 'Test', true), [createTile(0, 5, 12)]);
    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));

    const state = makeState({ players: [player], trains });
    const result = startTurn(state);
    expect(result.turnPhase).toBe('PLAY_TILE');
    expect(result.mustSatisfyDouble).toBe(false);
  });

  it('should transition to MUST_SATISFY_DOUBLE when double exists', () => {
    const player = dealToPlayer(createPlayer(0, 'Test', true), [createTile(0, 5, 12)]);
    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));

    const state = makeState({
      players: [player],
      trains,
      unsatisfiedDoubleTrainId: 'player-0',
    });
    const result = startTurn(state);
    expect(result.turnPhase).toBe('MUST_SATISFY_DOUBLE');
    expect(result.mustSatisfyDouble).toBe(true);
  });

  it('should process a normal play and end turn', () => {
    const tile = createTile(0, 5, 12);
    const player = dealToPlayer(createPlayer(0, 'Test', true), [tile, createTile(1, 3, 7)]);
    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));

    const state = makeState({ players: [player], trains, turnPhase: 'PLAY_TILE' });
    const move: LegalMove = { tile, trainId: 'player-0', orientation: 'flipped' };
    const result = processPlay(state, 0, move);

    expect(result.turnPhase).toBe('END_TURN');
    expect(result.players[0]!.hand).toHaveLength(1);
    expect(result.trains.get('player-0')!.tiles).toHaveLength(1);
    expect(result.trains.get('player-0')!.openEnd).toBe(5);
  });

  it('should grant bonus play on double', () => {
    const doubleTile = createTile(0, 12, 12);
    const player = dealToPlayer(createPlayer(0, 'Test', true), [doubleTile, createTile(1, 5, 12)]);
    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));

    const state = makeState({ players: [player], trains, turnPhase: 'PLAY_TILE' });
    const move: LegalMove = { tile: doubleTile, trainId: 'player-0', orientation: 'normal' };
    const result = processPlay(state, 0, move);

    expect(result.turnPhase).toBe('BONUS_PLAY');
    expect(result.doublesPlayedThisTurn).toBe(1);
  });

  it('should draw from boneyard', () => {
    const boneyardTile = createTile(50, 6, 12);
    const player = dealToPlayer(createPlayer(0, 'Test', true), [createTile(0, 1, 2)]);
    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));

    const state = makeState({ players: [player], trains, boneyard: [boneyardTile] });
    const result = processDraw(state, 0);

    expect(result.turnPhase).toBe('DREW_TILE');
    expect(result.players[0]!.hand).toHaveLength(2);
    expect(result.boneyard).toHaveLength(0);
  });

  it('should mark train when boneyard is empty', () => {
    const player = dealToPlayer(createPlayer(0, 'Test', true), [createTile(0, 1, 2)]);
    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));

    const state = makeState({ players: [player], trains, boneyard: [] });
    const result = processDraw(state, 0);

    expect(result.turnPhase).toBe('END_TURN');
    expect(result.trains.get('player-0')!.isOpen).toBe(true);
  });

  it('should close own train when playing on it while open', () => {
    const tile = createTile(0, 5, 12);
    const player = dealToPlayer(createPlayer(0, 'Test', true), [tile, createTile(1, 3, 7)]);
    const trains = new Map<string, Train>();
    const openTrain = { ...createTrain('player-0', 0, 12), isOpen: true };
    trains.set('player-0', openTrain);

    const state = makeState({ players: [player], trains });
    const move: LegalMove = { tile, trainId: 'player-0', orientation: 'flipped' };
    const result = processPlay(state, 0, move);

    expect(result.trains.get('player-0')!.isOpen).toBe(false);
  });

  it('should detect round over when player empties hand', () => {
    const tile = createTile(0, 5, 12);
    const player = dealToPlayer(createPlayer(0, 'Test', true), [tile]);
    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));

    const state = makeState({ players: [player], trains });
    const move: LegalMove = { tile, trainId: 'player-0', orientation: 'flipped' };
    const result = processPlay(state, 0, move);

    expect(result.roundOver).toBe(true);
    expect(result.turnPhase).toBe('END_TURN');
  });

  it('should advance to next player', () => {
    const p0 = dealToPlayer(createPlayer(0, 'A', true), [createTile(0, 1, 2)]);
    const p1 = dealToPlayer(createPlayer(1, 'B', false), [createTile(1, 3, 4)]);
    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    trains.set('player-1', createTrain('player-1', 1, 12));

    const state = makeState({ players: [p0, p1], trains, turnPhase: 'END_TURN', currentPlayerIndex: 0 });
    const result = endTurn(state);

    expect(result.currentPlayerIndex).toBe(1);
    expect(result.turnPhase).toBe('START_TURN');
  });

  it('should wrap around to first player', () => {
    const p0 = dealToPlayer(createPlayer(0, 'A', true), [createTile(0, 1, 2)]);
    const p1 = dealToPlayer(createPlayer(1, 'B', false), [createTile(1, 3, 4)]);
    const trains = new Map<string, Train>();
    trains.set('player-0', createTrain('player-0', 0, 12));
    trains.set('player-1', createTrain('player-1', 1, 12));

    const state = makeState({ players: [p0, p1], trains, turnPhase: 'END_TURN', currentPlayerIndex: 1 });
    const result = endTurn(state);

    expect(result.currentPlayerIndex).toBe(0);
  });
});
