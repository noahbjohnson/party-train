import { GameState, Train, Player, Tile, TurnPhase, TurnAction } from '../types.js';

const STORAGE_KEY = 'party-train-save';

interface SerializedGameState {
  round: number;
  hubValue: number;
  players: Player[];
  trains: Array<[string, Train]>;
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

export function saveGame(state: GameState): void {
  const serialized: SerializedGameState = {
    round: state.round,
    hubValue: state.hubValue,
    players: state.players,
    trains: [...state.trains.entries()],
    boneyard: state.boneyard,
    currentPlayerIndex: state.currentPlayerIndex,
    turnPhase: state.turnPhase,
    unsatisfiedDoubleTrainId: state.unsatisfiedDoubleTrainId,
    doublesPlayedThisTurn: state.doublesPlayedThisTurn,
    mustSatisfyDouble: state.mustSatisfyDouble,
    roundOver: state.roundOver,
    gameOver: state.gameOver,
    winnerId: state.winnerId,
    turnLog: state.turnLog,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // localStorage not available or quota exceeded
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const data = parsed as SerializedGameState;

    // Validate essential fields exist
    if (
      typeof data.round !== 'number' ||
      typeof data.hubValue !== 'number' ||
      !Array.isArray(data.players) ||
      !Array.isArray(data.trains) ||
      !Array.isArray(data.boneyard)
    ) {
      return null;
    }

    const state: GameState = {
      round: data.round,
      hubValue: data.hubValue,
      players: data.players,
      trains: new Map(data.trains),
      boneyard: data.boneyard,
      currentPlayerIndex: data.currentPlayerIndex,
      turnPhase: data.turnPhase,
      unsatisfiedDoubleTrainId: data.unsatisfiedDoubleTrainId,
      doublesPlayedThisTurn: data.doublesPlayedThisTurn,
      mustSatisfyDouble: data.mustSatisfyDouble,
      roundOver: data.roundOver,
      gameOver: data.gameOver,
      winnerId: data.winnerId,
      turnLog: data.turnLog,
    };

    return state;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}
