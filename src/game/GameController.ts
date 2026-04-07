import { GameState, GameConfig, LegalMove, AIStrategy, TOTAL_ROUNDS } from '../types.js';
import { createPlayer } from './Player.js';
import { initializeRound, scoreRound, isRoundOver, isGameOver, determineWinner } from './RoundManager.js';
import { startTurn, processPlay, processDraw, processDrawnTilePlay, processMarkTrain, endTurn } from './TurnManager.js';
import { getLegalMoves, hasAnyLegalMove, canDrawFromBoneyard } from './RuleEngine.js';

const AI_NAMES = ['Alice', 'Bob', 'Charlie'];

export class GameController {
  private state!: GameState;
  readonly config: GameConfig;
  private aiStrategies: Map<number, AIStrategy> = new Map();

  constructor(config: GameConfig) {
    this.config = config;
  }

  registerAI(playerId: number, strategy: AIStrategy): void {
    this.aiStrategies.set(playerId, strategy);
  }

  getState(): GameState {
    return this.state;
  }

  initGame(): GameState {
    const players = [];

    // Human player is always player 0
    players.push(createPlayer(0, this.config.playerName, true));

    // AI players
    for (let i = 1; i < this.config.playerCount; i++) {
      players.push(createPlayer(i, AI_NAMES[i - 1] ?? `AI ${i}`, false));
    }

    this.state = initializeRound(players, 0);
    return this.state;
  }

  initGameWithPlayers(players: ReturnType<typeof createPlayer>[]): GameState {
    this.state = initializeRound(players, 0);
    return this.state;
  }

  startNextRound(): GameState {
    const nextRound = this.state.round + 1;
    if (isGameOver(nextRound)) {
      const winnerId = determineWinner(this.state.players);
      this.state = {
        ...this.state,
        gameOver: true,
        winnerId,
      };
      return this.state;
    }

    this.state = initializeRound(this.state.players, nextRound);
    return this.state;
  }

  beginTurn(): GameState {
    this.state = startTurn(this.state);
    return this.state;
  }

  getLegalMovesForCurrentPlayer(): LegalMove[] {
    return getLegalMoves(this.state, this.state.currentPlayerIndex);
  }

  playTile(move: LegalMove): GameState {
    this.state = processPlay(this.state, this.state.currentPlayerIndex, move);

    if (isRoundOver(this.state)) {
      this.state = scoreRound(this.state);
    }

    return this.state;
  }

  drawTile(): GameState {
    this.state = processDraw(this.state, this.state.currentPlayerIndex);
    return this.state;
  }

  checkDrawnTile(): { state: GameState; canPlay: boolean; moves: LegalMove[] } {
    const result = processDrawnTilePlay(this.state, this.state.currentPlayerIndex);
    this.state = result.state;
    return result;
  }

  markTrainAndEndTurn(): GameState {
    this.state = processMarkTrain(this.state, this.state.currentPlayerIndex);
    return this.state;
  }

  advanceTurn(): GameState {
    this.state = endTurn(this.state);
    return this.state;
  }

  executeAITurn(): GameState {
    const playerId = this.state.currentPlayerIndex;
    const strategy = this.aiStrategies.get(playerId);
    if (!strategy) throw new Error(`No AI strategy for player ${playerId}`);

    this.state = startTurn(this.state);

    // AI turn loop
    let safety = 0;
    while (this.state.turnPhase !== 'END_TURN' && !this.state.roundOver && safety++ < 20) {
      const phase = this.state.turnPhase;

      if (phase === 'MUST_SATISFY_DOUBLE' || phase === 'PLAY_TILE' || phase === 'BONUS_PLAY') {
        const moves = getLegalMoves(this.state, playerId);
        if (moves.length > 0) {
          const chosen = strategy.choosePlay(this.state, playerId, moves);
          this.state = processPlay(this.state, playerId, chosen);
        } else if (canDrawFromBoneyard(this.state)) {
          this.state = processDraw(this.state, playerId);
        } else {
          this.state = processMarkTrain(this.state, playerId);
        }
      } else if (phase === 'DREW_TILE') {
        const result = processDrawnTilePlay(this.state, playerId);
        this.state = result.state;
        if (result.canPlay && result.moves.length > 0) {
          const chosen = strategy.choosePlay(this.state, playerId, result.moves);
          this.state = processPlay(this.state, playerId, chosen);
        }
      } else if (phase === 'MARK_TRAIN') {
        this.state = processMarkTrain(this.state, playerId);
      } else if (phase === 'MUST_DRAW') {
        if (canDrawFromBoneyard(this.state)) {
          this.state = processDraw(this.state, playerId);
        } else {
          this.state = processMarkTrain(this.state, playerId);
        }
      }
    }

    if (isRoundOver(this.state)) {
      this.state = scoreRound(this.state);
    }

    return this.state;
  }

  runFullGame(): GameState {
    this.initGame();

    for (let round = 0; round < TOTAL_ROUNDS; round++) {
      if (round > 0) {
        this.state = initializeRound(this.state.players, round);
      }

      let turnSafety = 0;
      while (!this.state.roundOver && turnSafety++ < 500) {
        this.executeAITurn();
        if (!this.state.roundOver) {
          this.state = endTurn(this.state);
        }
      }
    }

    const winnerId = determineWinner(this.state.players);
    this.state = {
      ...this.state,
      gameOver: true,
      winnerId,
    };

    return this.state;
  }

  runFullGameAllAI(): GameState {
    // Same as runFullGame but doesn't assume player 0 is human
    for (let round = 0; round < TOTAL_ROUNDS; round++) {
      if (round > 0) {
        this.state = initializeRound(this.state.players, round);
      }

      let turnSafety = 0;
      while (!this.state.roundOver && turnSafety++ < 500) {
        this.executeAITurn();
        if (!this.state.roundOver) {
          this.state = endTurn(this.state);
        }
      }
    }

    const winnerId = determineWinner(this.state.players);
    this.state = {
      ...this.state,
      gameOver: true,
      winnerId,
    };

    return this.state;
  }
}
