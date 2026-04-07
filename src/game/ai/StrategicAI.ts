import { AIStrategy, GameState, LegalMove, Difficulty, Tile } from '../../types.js';

export class StrategicAI implements AIStrategy {
  readonly difficulty: Difficulty = 'hard';
  private playedTiles: Set<number> = new Set();

  choosePlay(state: GameState, playerId: number, legalMoves: LegalMove[]): LegalMove {
    if (legalMoves.length === 0) {
      throw new Error('StrategicAI: no legal moves to choose from');
    }

    this.updateTracking(state);

    const player = state.players[playerId];
    if (!player) throw new Error(`Invalid player ${playerId}`);

    const scored = legalMoves.map(move => ({
      move,
      score: this.scoreMove(state, playerId, move, player.hand),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0]!.move;
  }

  private updateTracking(state: GameState): void {
    this.playedTiles.clear();
    for (const train of state.trains.values()) {
      for (const played of train.tiles) {
        this.playedTiles.add(played.tile.id);
      }
    }
  }

  private scoreMove(state: GameState, playerId: number, move: LegalMove, hand: Tile[]): number {
    let score = 0;

    // Base: dump high-pip tiles
    score += move.tile.pipCount * 2;

    // Double management: only play doubles if we have 2+ satisfiers
    if (move.tile.isDouble) {
      const satisfiers = hand.filter(
        t => t.id !== move.tile.id && (t.sideA === move.tile.sideA || t.sideB === move.tile.sideA)
      );
      if (satisfiers.length >= 2) {
        score += 15;
      } else if (satisfiers.length === 1) {
        score += 0;
      } else {
        score -= 30;
      }
    }

    // Close own train
    const ownTrainId = `player-${playerId}`;
    const ownTrain = state.trains.get(ownTrainId);
    if (move.trainId === ownTrainId && ownTrain?.isOpen) {
      score += 20;
    }

    // Play on opponents
    const targetTrain = state.trains.get(move.trainId);
    if (targetTrain && targetTrain.ownerId !== null && targetTrain.ownerId !== playerId) {
      score += 8;
    }

    // Endgame: minimize remaining pips when boneyard is low
    if (state.boneyard.length < 10) {
      score += move.tile.pipCount * 3;
    }

    // Blocking awareness: if opponent train is open, avoid plays that help them
    if (targetTrain && targetTrain.ownerId !== null && targetTrain.ownerId !== playerId) {
      // Prefer playing values that are less common in remaining tiles
      const remainingCount = this.countRemainingTilesWithValue(state, targetTrain.openEnd, hand);
      if (remainingCount < 3) {
        score += 5; // Good — we're playing on a value that's scarce
      }
    }

    // Preserve flexibility: prefer tiles with values we have many of
    const sideACount = hand.filter(t => t.id !== move.tile.id && (t.sideA === move.tile.sideA || t.sideB === move.tile.sideA)).length;
    const sideBCount = hand.filter(t => t.id !== move.tile.id && (t.sideA === move.tile.sideB || t.sideB === move.tile.sideB)).length;
    score -= (sideACount + sideBCount); // Slight penalty for playing tiles that match many others

    // Small jitter
    score += (Math.random() - 0.5) * 4;

    return score;
  }

  private countRemainingTilesWithValue(state: GameState, value: number, hand: Tile[]): number {
    // Count tiles with this value that haven't been played and aren't in our hand
    let count = 0;
    // Total tiles with this value: value+1 tiles for values 0-12 (one for each pair)
    const totalWithValue = 13; // Each value appears on 13 tiles in a double-12 set
    const playedWithValue = [...this.playedTiles].filter(id => {
      for (const train of state.trains.values()) {
        const pt = train.tiles.find(t => t.tile.id === id);
        if (pt && (pt.tile.sideA === value || pt.tile.sideB === value)) return true;
      }
      return false;
    }).length;
    const inHandWithValue = hand.filter(t => t.sideA === value || t.sideB === value).length;
    count = totalWithValue - playedWithValue - inHandWithValue;
    return Math.max(0, count);
  }
}
