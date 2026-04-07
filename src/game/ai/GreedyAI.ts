import { AIStrategy, GameState, LegalMove, Difficulty, Tile } from '../../types.js';

export class GreedyAI implements AIStrategy {
  readonly difficulty: Difficulty = 'medium';

  choosePlay(state: GameState, playerId: number, legalMoves: LegalMove[]): LegalMove {
    if (legalMoves.length === 0) {
      throw new Error('GreedyAI: no legal moves to choose from');
    }

    const player = state.players[playerId];
    if (!player) throw new Error(`Invalid player ${playerId}`);

    const scored = legalMoves.map(move => ({
      move,
      score: this.scoreMove(state, playerId, move, player.hand),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0]!.move;
  }

  private scoreMove(state: GameState, playerId: number, move: LegalMove, hand: Tile[]): number {
    let score = 0;

    // Dump high-pip tiles first
    score += move.tile.pipCount * 2;

    // Avoid playing doubles unless you have a satisfier
    if (move.tile.isDouble) {
      const canSatisfy = hand.some(
        t => t.id !== move.tile.id && (t.sideA === move.tile.sideA || t.sideB === move.tile.sideA)
      );
      score += canSatisfy ? 10 : -20;
    }

    // Close your own train
    const ownTrainId = `player-${playerId}`;
    const ownTrain = state.trains.get(ownTrainId);
    if (move.trainId === ownTrainId && ownTrain?.isOpen) {
      score += 15;
    }

    // Play on opponents when possible
    const targetTrain = state.trains.get(move.trainId);
    if (targetTrain && targetTrain.ownerId !== null && targetTrain.ownerId !== playerId) {
      score += 5;
    }

    // Add jitter
    score += (Math.random() - 0.5) * 6;

    return score;
  }
}
