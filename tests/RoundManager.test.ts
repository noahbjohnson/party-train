import { describe, it, expect } from 'vitest';
import { initializeRound, scoreRound, isRoundOver, isGameOver, determineWinner } from '../src/game/RoundManager.js';
import { createPlayer } from '../src/game/Player.js';
import { TILES_PER_PLAYER, TOTAL_ROUNDS } from '../src/types.js';

describe('RoundManager', () => {
  it('should deal correct number of tiles for 2 players', () => {
    const players = [createPlayer(0, 'A', true), createPlayer(1, 'B', false)];
    const state = initializeRound(players, 0);

    expect(state.players[0]!.hand).toHaveLength(15);
    expect(state.players[1]!.hand).toHaveLength(15);
    expect(state.boneyard).toHaveLength(90 - 30); // 90 tiles after removing starting double, minus 30 dealt
  });

  it('should deal correct number of tiles for 3 players', () => {
    const players = [createPlayer(0, 'A', true), createPlayer(1, 'B', false), createPlayer(2, 'C', false)];
    const state = initializeRound(players, 0);

    for (const p of state.players) {
      expect(p.hand).toHaveLength(13);
    }
    expect(state.boneyard).toHaveLength(90 - 39);
  });

  it('should deal correct number of tiles for 4 players', () => {
    const players = [
      createPlayer(0, 'A', true), createPlayer(1, 'B', false),
      createPlayer(2, 'C', false), createPlayer(3, 'D', false),
    ];
    const state = initializeRound(players, 0);

    for (const p of state.players) {
      expect(p.hand).toHaveLength(11);
    }
    expect(state.boneyard).toHaveLength(90 - 44);
  });

  it('should set hub value correctly (round 0 = 12)', () => {
    const players = [createPlayer(0, 'A', true), createPlayer(1, 'B', false)];
    const state = initializeRound(players, 0);
    expect(state.hubValue).toBe(12);
  });

  it('should set hub value correctly (round 5 = 7)', () => {
    const players = [createPlayer(0, 'A', true), createPlayer(1, 'B', false)];
    const state = initializeRound(players, 5);
    expect(state.hubValue).toBe(7);
  });

  it('should create trains for all players plus party train', () => {
    const players = [createPlayer(0, 'A', true), createPlayer(1, 'B', false)];
    const state = initializeRound(players, 0);

    expect(state.trains.has('player-0')).toBe(true);
    expect(state.trains.has('player-1')).toBe(true);
    expect(state.trains.has('party')).toBe(true);
    expect(state.trains.get('player-0')!.openEnd).toBe(12);
    expect(state.trains.get('party')!.openEnd).toBe(12);
  });

  it('should score remaining pips correctly', () => {
    const players = [createPlayer(0, 'A', true), createPlayer(1, 'B', false)];
    const state = initializeRound(players, 0);

    // Force a known hand state for scoring
    const manualState = {
      ...state,
      roundOver: true,
    };

    const scored = scoreRound(manualState);

    for (const p of scored.players) {
      const expectedScore = p.hand.reduce((sum, t) => sum + t.pipCount, 0);
      expect(p.roundScore).toBe(expectedScore);
      expect(p.score).toBe(expectedScore); // First round, so total = round score
    }
  });

  it('should detect round over when a player has no tiles', () => {
    const players = [createPlayer(0, 'A', true), createPlayer(1, 'B', false)];
    const state = initializeRound(players, 0);

    // Empty one player's hand
    const emptyHandState = {
      ...state,
      players: [{ ...state.players[0]!, hand: [] }, state.players[1]!],
    };

    expect(isRoundOver(emptyHandState)).toBe(true);
  });

  it('should detect game over after 13 rounds', () => {
    expect(isGameOver(TOTAL_ROUNDS)).toBe(true);
    expect(isGameOver(TOTAL_ROUNDS - 1)).toBe(false);
    expect(isGameOver(0)).toBe(false);
  });

  it('should determine winner as player with lowest score', () => {
    const players = [
      { ...createPlayer(0, 'A', true), score: 150 },
      { ...createPlayer(1, 'B', false), score: 80 },
      { ...createPlayer(2, 'C', false), score: 200 },
    ];
    expect(determineWinner(players)).toBe(1);
  });
});
