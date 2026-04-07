import { describe, it, expect } from 'vitest';
import { RandomAI } from '../src/game/ai/RandomAI.js';
import { GreedyAI } from '../src/game/ai/GreedyAI.js';
import { StrategicAI } from '../src/game/ai/StrategicAI.js';
import { createTile } from '../src/game/Tile.js';
import { createTrain } from '../src/game/Train.js';
import { createPlayer, dealToPlayer } from '../src/game/Player.js';
import { GameState, Train, Player, LegalMove } from '../src/types.js';

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

describe('AI', () => {
  const sampleMoves: LegalMove[] = [
    { tile: createTile(0, 5, 12), trainId: 'player-0', orientation: 'flipped' },
    { tile: createTile(1, 3, 12), trainId: 'player-0', orientation: 'flipped' },
    { tile: createTile(2, 10, 12), trainId: 'party', orientation: 'flipped' },
  ];

  const player = dealToPlayer(createPlayer(0, 'Test', false), [
    createTile(0, 5, 12),
    createTile(1, 3, 12),
    createTile(2, 10, 12),
  ]);

  const trains = new Map<string, Train>();
  trains.set('player-0', createTrain('player-0', 0, 12));
  trains.set('party', createTrain('party', null, 12));

  const state = makeState({ players: [player], trains });

  describe('RandomAI', () => {
    it('should always pick a valid legal move', () => {
      const ai = new RandomAI();
      for (let i = 0; i < 100; i++) {
        const chosen = ai.choosePlay(state, 0, sampleMoves);
        expect(sampleMoves).toContainEqual(chosen);
      }
    });

    it('should throw when no moves available', () => {
      const ai = new RandomAI();
      expect(() => ai.choosePlay(state, 0, [])).toThrow();
    });
  });

  describe('GreedyAI', () => {
    it('should prefer high-pip tiles', () => {
      const ai = new GreedyAI();
      const results = new Map<number, number>();

      for (let i = 0; i < 200; i++) {
        const chosen = ai.choosePlay(state, 0, sampleMoves);
        results.set(chosen.tile.id, (results.get(chosen.tile.id) ?? 0) + 1);
      }

      // Tile [10|12] has highest pip count (22), should be chosen most often
      const tile2Count = results.get(2) ?? 0;
      const tile1Count = results.get(1) ?? 0; // [3|12] = 15 pips
      expect(tile2Count).toBeGreaterThan(tile1Count);
    });
  });

  describe('StrategicAI', () => {
    it('should always pick a valid move', () => {
      const ai = new StrategicAI();
      for (let i = 0; i < 100; i++) {
        const chosen = ai.choosePlay(state, 0, sampleMoves);
        expect(sampleMoves).toContainEqual(chosen);
      }
    });
  });
});
