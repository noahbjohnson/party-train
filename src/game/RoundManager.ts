import { GameState, Player, Train, Tile, TILES_PER_PLAYER, TOTAL_ROUNDS } from '../types.js';
import { generateFullSet, shuffleTiles, findDouble } from './TileSet.js';
import { createTrain } from './Train.js';
import { createPlayer, dealToPlayer, calculateRoundScore } from './Player.js';
import { areAllPlayersBlocked } from './RuleEngine.js';

export function initializeRound(
  players: Player[],
  roundIndex: number,
): GameState {
  const hubValue = 12 - roundIndex;
  const fullSet = generateFullSet();

  // Find and remove the starting double
  const startingDouble = findDouble(fullSet, hubValue);
  if (!startingDouble) throw new Error(`No double-${hubValue} found`);

  const remainingTiles = fullSet.filter(t => t.id !== startingDouble.id);
  const shuffled = shuffleTiles(remainingTiles);

  const tilesPerPlayer = TILES_PER_PLAYER[players.length];
  if (tilesPerPlayer === undefined) throw new Error(`Invalid player count: ${players.length}`);

  // Deal tiles
  let dealIndex = 0;
  const dealtPlayers = players.map(p => {
    const hand = shuffled.slice(dealIndex, dealIndex + tilesPerPlayer);
    dealIndex += tilesPerPlayer;
    return dealToPlayer({ ...p, hand: [], roundScore: 0 }, hand);
  });

  // Remaining tiles form the boneyard
  const boneyard = shuffled.slice(dealIndex);

  // Create trains
  const trains = new Map<string, Train>();
  for (const player of dealtPlayers) {
    trains.set(player.trainId, createTrain(player.trainId, player.id, hubValue));
  }
  trains.set('party', createTrain('party', null, hubValue));

  // Rotate starting player each round — offset by round so different player starts each time
  // Adding 1 ensures round 0 doesn't always start with player 0 (the human)
  const firstPlayerIndex = (roundIndex + 1) % players.length;

  return {
    round: roundIndex,
    hubValue,
    players: dealtPlayers,
    trains,
    boneyard,
    currentPlayerIndex: firstPlayerIndex,
    turnPhase: 'START_TURN',
    unsatisfiedDoubleTrainId: null,
    doublesPlayedThisTurn: 0,
    mustSatisfyDouble: false,
    roundOver: false,
    gameOver: false,
    winnerId: null,
    turnLog: [],
  };
}

export function scoreRound(state: GameState): GameState {
  const scoredPlayers = state.players.map(p => {
    const roundScore = calculateRoundScore(p);
    return {
      ...p,
      roundScore,
      score: p.score + roundScore,
    };
  });

  return {
    ...state,
    players: scoredPlayers,
    roundOver: true,
  };
}

export function isRoundOver(state: GameState): boolean {
  if (state.roundOver) return true;

  // A player emptied their hand
  if (state.players.some(p => p.hand.length === 0)) return true;

  // All players are blocked
  if (areAllPlayersBlocked(state)) return true;

  return false;
}

export function isGameOver(roundIndex: number): boolean {
  return roundIndex >= TOTAL_ROUNDS;
}

export function determineWinner(players: Player[]): number {
  let minScore = Infinity;
  let winnerId = 0;
  for (const player of players) {
    if (player.score < minScore) {
      minScore = player.score;
      winnerId = player.id;
    }
  }
  return winnerId;
}
