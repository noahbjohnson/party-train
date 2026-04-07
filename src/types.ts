// ============================================================
// Party Train Dominoes — Shared Type Definitions
// Single source of truth for all interfaces, enums, and types
// ============================================================

// --- Core Data Models ---

export interface Tile {
  readonly id: number;           // 0–90, unique identifier
  readonly sideA: number;        // 0–12, always sideA <= sideB
  readonly sideB: number;        // 0–12
  readonly isDouble: boolean;    // sideA === sideB
  readonly pipCount: number;     // sideA + sideB
}

export interface PlayedTile {
  tile: Tile;
  orientation: 'normal' | 'flipped'; // which side connects to the train
}

export interface Train {
  id: string;                         // "player-0", "player-1", ..., "party"
  ownerId: number | null;             // null for Party Train
  tiles: PlayedTile[];                // ordered list of tiles on this train
  openEnd: number;                    // pip value at the end accepting new tiles
  isOpen: boolean;                    // true = any player can play on this train
  hasUnsatisfiedDouble: boolean;      // last tile was a double not yet covered
}

export interface Player {
  id: number;
  name: string;
  hand: Tile[];
  isHuman: boolean;
  trainId: string;
  score: number;        // running total across rounds
  roundScore: number;   // pips remaining this round
}

// --- Turn Phase State Machine ---

export type TurnPhase =
  | 'START_TURN'
  | 'MUST_SATISFY_DOUBLE'
  | 'PLAY_TILE'
  | 'BONUS_PLAY'
  | 'MUST_DRAW'
  | 'DREW_TILE'
  | 'MARK_TRAIN'
  | 'END_TURN';

// --- Game State ---

export interface TurnAction {
  type: 'play' | 'draw' | 'mark' | 'pass';
  playerId: number;
  tile?: Tile;
  trainId?: string;
  orientation?: 'normal' | 'flipped';
}

export interface GameState {
  round: number;                              // 0–12 (index), starting double = 12 - round
  hubValue: number;                           // pip value of the center double
  players: Player[];
  trains: Map<string, Train>;
  boneyard: Tile[];
  currentPlayerIndex: number;
  turnPhase: TurnPhase;
  unsatisfiedDoubleTrainId: string | null;
  doublesPlayedThisTurn: number;
  mustSatisfyDouble: boolean;
  roundOver: boolean;
  gameOver: boolean;
  winnerId: number | null;
  turnLog: TurnAction[];
}

// --- AI ---

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface LegalMove {
  tile: Tile;
  trainId: string;
  orientation: 'normal' | 'flipped';
}

export interface AIStrategy {
  readonly difficulty: Difficulty;
  choosePlay(state: GameState, playerId: number, legalMoves: LegalMove[]): LegalMove;
}

// --- Event Bus ---

export type GameEventMap = {
  // Game → Renderer
  'tile:played': { tile: Tile; trainId: string; position: number; isDouble: boolean };
  'tile:drawn': { playerId: number; tile: Tile | null; boneyardRemaining: number };
  'train:markerSet': { trainId: string; isOpen: boolean };
  'turn:start': { playerId: number; mustSatisfyDouble: boolean; doubleTrainId: string | null };
  'turn:end': { playerId: number };
  'round:start': { roundNumber: number; hubValue: number; playerHands: Map<number, Tile[]>; boneyardCount: number };
  'round:end': { scores: Map<number, number>; runningTotals: Map<number, number> };
  'game:over': { winnerId: number; finalScores: Map<number, number> };
  'ai:thinking': { playerId: number };
  'ai:decided': { playerId: number };
  'hand:updated': { playerId: number; hand: Tile[] };
  'legalMoves:updated': { moves: Array<{ tile: Tile; trainId: string }> };
  'bestTrain:updated': { status: 'green' | 'yellow' | 'red' };

  // Renderer → Game
  'input:tileSelected': { tileId: number };
  'input:trainSelected': { trainId: string };
  'input:drawRequested': Record<string, never>;
  'input:passRequested': Record<string, never>;
  'input:undoRequested': Record<string, never>;
  'input:sortRequested': { mode: SortMode };

  // UI → Game
  'ui:newGame': { playerCount: number; difficulty: Difficulty; playerName: string };
  'ui:nextRound': Record<string, never>;
  'ui:restartGame': Record<string, never>;
};

export type SortMode = 'left' | 'right' | 'total' | 'color';

// --- Config ---

export interface GameConfig {
  playerCount: number;   // 2–4
  difficulty: Difficulty;
  playerName: string;
  firstTurnChainPlay: boolean; // house rule, default false
}

export const TILES_PER_PLAYER: Record<number, number> = {
  2: 15,
  3: 13,
  4: 11,
};

export const TOTAL_TILES = 91;
export const MAX_PIP = 12;
export const TOTAL_ROUNDS = 13;
export const MAX_CONSECUTIVE_DOUBLES = 3;
