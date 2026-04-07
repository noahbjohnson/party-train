import { AIStrategy, GameState, LegalMove, Difficulty } from '../../types.js';

export class RandomAI implements AIStrategy {
  readonly difficulty: Difficulty = 'easy';

  choosePlay(_state: GameState, _playerId: number, legalMoves: LegalMove[]): LegalMove {
    if (legalMoves.length === 0) {
      throw new Error('RandomAI: no legal moves to choose from');
    }
    const index = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[index]!;
  }
}
