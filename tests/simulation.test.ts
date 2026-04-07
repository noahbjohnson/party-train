import { describe, it, expect } from 'vitest';
import { GameController } from '../src/game/GameController.js';
import { RandomAI } from '../src/game/ai/RandomAI.js';
import { createPlayer } from '../src/game/Player.js';

describe('Game Simulation', () => {
  it('should complete 100 games with 4 random AI players without errors', () => {
    const errors: string[] = [];

    for (let g = 0; g < 100; g++) {
      try {
        const controller = new GameController({
          playerCount: 4,
          difficulty: 'easy',
          playerName: 'P0',
          firstTurnChainPlay: false,
        });

        // Override all players as AI
        const players = [
          createPlayer(0, 'Alice', false),
          createPlayer(1, 'Bob', false),
          createPlayer(2, 'Charlie', false),
          createPlayer(3, 'Diana', false),
        ];

        controller.initGameWithPlayers(players);

        for (let i = 0; i < 4; i++) {
          controller.registerAI(i, new RandomAI());
        }

        const finalState = controller.runFullGameAllAI();

        // Verify game completed
        expect(finalState.gameOver).toBe(true);
        expect(finalState.winnerId).not.toBeNull();

        // Scores should be non-negative
        for (const player of finalState.players) {
          expect(player.score).toBeGreaterThanOrEqual(0);
        }
      } catch (e) {
        errors.push(`Game ${g}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`${errors.length} games failed:\n${errors.slice(0, 10).join('\n')}`);
    }
  }, 30000);
});
