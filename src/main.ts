import './ui/styles.css';
import { GameController } from './game/GameController.js';
import { RandomAI } from './game/ai/RandomAI.js';
import { GreedyAI } from './game/ai/GreedyAI.js';
import { StrategicAI } from './game/ai/StrategicAI.js';
import { createPlayer } from './game/Player.js';
import { sortHand } from './game/Player.js';
import { getLegalMoves } from './game/RuleEngine.js';
import { EventBus } from './utils/EventBus.js';
import { generateTileAtlas } from './engine/TileAtlas.js';
import { TileRenderer } from './engine/TileRenderer.js';
import { GridLayout } from './engine/GridLayout.js';
import { HandRenderer } from './engine/HandRenderer.js';
import { TrainRowRenderer } from './engine/TrainRowRenderer.js';
import { AnimationManager } from './engine/AnimationManager.js';
import { PlayerPanel } from './ui/PlayerPanel.js';
import { InfoPanel } from './ui/InfoPanel.js';
import { TopBar } from './ui/TopBar.js';
import { Sidebar } from './ui/Sidebar.js';
import { ToastManager } from './ui/ToastManager.js';
import { SetupScreen } from './ui/SetupScreen.js';
import { ScoreOverlay } from './ui/ScoreOverlay.js';
import { SoundManager } from './audio/SoundManager.js';
import { HelpOverlay } from './ui/HelpOverlay.js';
import { saveGame, loadGame, clearSave } from './utils/SaveManager.js';
import { AIStrategy, Difficulty, GameState, LegalMove, SortMode, Tile, Train, Player } from './types.js';
import { AI_THINK_DELAY } from './utils/Constants.js';

// --- DOM Setup ---
const app = document.getElementById('app')!;

const topBarEl = document.createElement('div');
app.appendChild(topBarEl);

const sidebarEl = document.createElement('div');
app.appendChild(sidebarEl);

const gameAreaEl = document.createElement('div');
gameAreaEl.className = 'game-area';
app.appendChild(gameAreaEl);

const handAreaEl = document.createElement('div');
handAreaEl.className = 'hand-area';
app.appendChild(handAreaEl);

const playerPanelEl = document.createElement('div');
app.appendChild(playerPanelEl);

const infoPanelEl = document.createElement('div');
app.appendChild(infoPanelEl);

const toastContainerEl = document.createElement('div');
app.appendChild(toastContainerEl);

// --- Core Instances ---
const eventBus = new EventBus();
const atlas = generateTileAtlas();
const tileRenderer = new TileRenderer(atlas, gameAreaEl);
const handTileRenderer = new TileRenderer(atlas, handAreaEl);
const gridLayout = new GridLayout();
const handRenderer = new HandRenderer(gridLayout, handTileRenderer, handAreaEl);
handRenderer.setReorderCallback((fromIndex, toIndex) => {
  const state = controller.getState();
  const human = state.players[0];
  if (!human) return;
  const tile = human.hand.splice(fromIndex, 1)[0];
  if (tile) {
    human.hand.splice(toIndex, 0, tile);
    renderState(state);
  }
});
const trainRowRenderer = new TrainRowRenderer(gridLayout, tileRenderer);
const animationManager = new AnimationManager();

// --- UI Instances ---
const topBar = new TopBar(topBarEl);
const sidebar = new Sidebar(sidebarEl, eventBus);
const playerPanel = new PlayerPanel(playerPanelEl);
const infoPanel = new InfoPanel(infoPanelEl);
infoPanel.setAtlas(atlas);
const toastManager = new ToastManager(toastContainerEl);
const scoreOverlay = new ScoreOverlay(app, eventBus);
const setupScreen = new SetupScreen(app, eventBus);
const helpOverlay = new HelpOverlay(app);

// Wire sidebar Help button
sidebar.setHelpToggle(() => helpOverlay.toggle());

// --- Game State ---
let controller: GameController;
let selectedTileId: number | null = null;
let currentSortMode: SortMode = 'total';
let isProcessingAI = false;
let previousState: GameState | null = null;
let hasDrawnThisTurn = false;
const soundManager = new SoundManager();

// --- Deep Clone Helper ---
function cloneGameState(state: GameState): GameState {
  const clonedPlayers: Player[] = state.players.map(p => ({
    ...p,
    hand: [...p.hand],
  }));

  const clonedTrains = new Map<string, Train>();
  for (const [key, train] of state.trains) {
    clonedTrains.set(key, {
      ...train,
      tiles: train.tiles.map(pt => ({ ...pt })),
    });
  }

  return {
    ...state,
    players: clonedPlayers,
    trains: clonedTrains,
    boneyard: [...state.boneyard],
    turnLog: state.turnLog.map(a => ({ ...a })),
  };
}

function createAI(difficulty: Difficulty): AIStrategy {
  switch (difficulty) {
    case 'easy': return new RandomAI();
    case 'medium': return new GreedyAI();
    case 'hard': return new StrategicAI();
  }
}

function getAIDelay(difficulty: Difficulty): number {
  const range = AI_THINK_DELAY[difficulty]!;
  return range.min + Math.random() * (range.max - range.min);
}

// --- Game Flow ---
function startGame(playerCount: number, difficulty: Difficulty, playerName: string): void {
  controller = new GameController({
    playerCount,
    difficulty,
    playerName,
    firstTurnChainPlay: false,
  });

  controller.initGame();

  // Register AI for non-human players
  for (let i = 1; i < playerCount; i++) {
    controller.registerAI(i, createAI(difficulty));
  }

  startRound();
}

function startRound(): void {
  const state = controller.getState();
  tileRenderer.clearAll();
  handTileRenderer.clearAll();
  updateLayout();

  // Update layout
  const trainIds = [...state.trains.keys()];
  const layout = gridLayout.computeLayout(trainIds, 'player-0');

  // Create train row elements
  gameAreaEl.textContent = '';
  for (const row of layout.trainRows) {
    const rowEl = document.createElement('div');
    rowEl.className = 'train-row';
    rowEl.dataset['trainId'] = row.trainId;
    rowEl.style.height = `${row.height}px`;

    rowEl.addEventListener('click', () => {
      if (selectedTileId !== null && !isProcessingAI) {
        handleTrainClick(row.trainId);
      }
    });

    gameAreaEl.appendChild(rowEl);
  }

  // Update UI
  topBar.updateRound(state.round, state.hubValue);
  infoPanel.updateBonePile(state.boneyard.length);
  infoPanel.updateStartDouble(state.hubValue);

  renderState(state);
  startPlayerTurn();
}

function renderState(state: GameState): void {
  const trainIds = [...state.trains.keys()];
  const layout = gridLayout.computeLayout(trainIds, 'player-0');

  // Render trains
  trainRowRenderer.renderAllTrains(state.trains, layout.trainRows);

  // Render human hand
  const human = state.players[0];
  if (human) {
    handRenderer.renderHand(human.hand, layout.hand);
  }

  // Update player panel
  const rowHeight = layout.trainRows[0]?.height ?? 100;
  playerPanel.render(state.players, state.trains, state.currentPlayerIndex, rowHeight);

  // Update info panel
  infoPanel.updateBonePile(state.boneyard.length);

  // Update best train indicator
  if (human) {
    const moves = getLegalMoves(state, 0);
    if (moves.length === 0) infoPanel.updateBestTrain('red');
    else if (moves.length >= 3) infoPanel.updateBestTrain('green');
    else infoPanel.updateBestTrain('yellow');
  }

  // Highlight eligible trains
  highlightEligibleTrains(state);
}

function highlightEligibleTrains(state: GameState): void {
  const rows = gameAreaEl.querySelectorAll('.train-row');
  rows.forEach(row => {
    const el = row as HTMLElement;
    el.classList.remove('eligible', 'has-unsatisfied-double');

    if (state.unsatisfiedDoubleTrainId === el.dataset['trainId']) {
      el.classList.add('has-unsatisfied-double');
    }
  });
}

function startPlayerTurn(): void {
  const state = controller.getState();
  if (state.roundOver || state.gameOver) {
    handleRoundEnd();
    return;
  }

  controller.beginTurn();
  const currentState = controller.getState();
  const currentPlayer = currentState.players[currentState.currentPlayerIndex];
  if (!currentPlayer) return;

  if (!currentPlayer.isHuman) {
    processAITurn(currentState);
    return;
  }

  // Human turn — save state for undo
  previousState = cloneGameState(currentState);
  selectedTileId = null;
  hasDrawnThisTurn = false;
  sidebar.disableAll();

  const moves = controller.getLegalMovesForCurrentPlayer();
  if (moves.length > 0) {
    // Highlight playable tiles
    const playableIds = new Set(moves.map(m => m.tile.id));
    handRenderer.highlightPlayable(playableIds);
    sidebar.enableButton('sort');
    sidebar.enableButton('undo');

    if (currentState.mustSatisfyDouble) {
      toastManager.show('You must satisfy the double!');
    }
  } else {
    // Must draw
    if (currentState.boneyard.length > 0) {
      sidebar.enableButton('draw');
      sidebar.pulseButton('draw');
      toastManager.show('No valid plays — draw a tile');
    } else {
      // Auto-pass
      sidebar.enableButton('pass');
      toastManager.show('No plays available — pass');
    }
  }

  renderState(controller.getState());
}

function handleTileClick(tileId: number): void {
  if (isProcessingAI) return;

  const state = controller.getState();
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer?.isHuman) return;

  if (selectedTileId === tileId) {
    // Deselect
    selectedTileId = null;
    handRenderer.clearHighlights();
    const moves = controller.getLegalMovesForCurrentPlayer();
    handRenderer.highlightPlayable(new Set(moves.map(m => m.tile.id)));

    // Remove train highlights
    const rows = gameAreaEl.querySelectorAll('.train-row');
    rows.forEach(r => (r as HTMLElement).classList.remove('eligible'));
    return;
  }

  selectedTileId = tileId;

  // Highlight selected tile
  handRenderer.clearHighlights();
  handTileRenderer.highlight(tileId, true);

  // Highlight eligible trains for this tile
  const moves = getLegalMoves(state, state.currentPlayerIndex).filter(m => m.tile.id === tileId);
  const rows = gameAreaEl.querySelectorAll('.train-row');
  rows.forEach(row => {
    const el = row as HTMLElement;
    const trainId = el.dataset['trainId'];
    el.classList.toggle('eligible', moves.some(m => m.trainId === trainId));
  });
}

function handleTrainClick(trainId: string): void {
  if (selectedTileId === null || isProcessingAI) return;

  const state = controller.getState();
  const moves = getLegalMoves(state, state.currentPlayerIndex);
  const move = moves.find(m => m.tile.id === selectedTileId && m.trainId === trainId);

  if (!move) {
    toastManager.show('Invalid play!');
    return;
  }

  // Play the tile
  controller.playTile(move);
  soundManager.playTilePlace();
  selectedTileId = null;

  const newState = controller.getState();

  if (newState.roundOver) {
    renderState(newState);
    handleRoundEnd();
    return;
  }

  if (newState.turnPhase === 'BONUS_PLAY') {
    toastManager.show('Double! Play again!');
    renderState(newState);
    // Re-enable hand interaction for bonus play
    const bonusMoves = controller.getLegalMovesForCurrentPlayer();
    if (bonusMoves.length > 0) {
      handRenderer.highlightPlayable(new Set(bonusMoves.map(m => m.tile.id)));
    } else {
      // Must draw for bonus
      handleDraw();
    }
    return;
  }

  if (newState.turnPhase === 'END_TURN') {
    renderState(newState);
    advanceToNextTurn();
    return;
  }

  renderState(newState);
}

function handleDraw(): void {
  if (isProcessingAI || hasDrawnThisTurn) return;
  if (controller.getState().boneyard.length === 0) return;
  hasDrawnThisTurn = true;

  controller.drawTile();
  soundManager.playTileDraw();
  const state = controller.getState();
  toastManager.show('Drew a tile');

  renderState(state);

  const result = controller.checkDrawnTile();
  if (result.canPlay && result.moves.length > 0) {
    toastManager.show('Drawn tile is playable!');
    handRenderer.highlightPlayable(new Set(result.moves.map(m => m.tile.id)));
    sidebar.disableAll();
    sidebar.enableButton('sort');
  } else {
    // Already marked train in checkDrawnTile
    soundManager.playMarker();
    toastManager.show('Cannot play — train marked open');
    renderState(controller.getState());
    advanceToNextTurn();
  }
}

function handlePass(): void {
  if (isProcessingAI) return;
  controller.markTrainAndEndTurn();
  soundManager.playMarker();
  toastManager.show('Pass — train marked open');
  renderState(controller.getState());
  advanceToNextTurn();
}

function handleSort(): void {
  const modes: SortMode[] = ['total', 'left', 'right', 'color'];
  const currentIndex = modes.indexOf(currentSortMode);
  currentSortMode = modes[(currentIndex + 1) % modes.length]!;

  const state = controller.getState();
  const human = state.players[0];
  if (!human) return;

  const sorted = sortHand(human.hand, currentSortMode);
  // Update the hand in place (mutate for rendering)
  human.hand.length = 0;
  human.hand.push(...sorted);

  renderState(state);
  toastManager.show(`Sorted by ${currentSortMode}`);
}

function handleUndo(): void {
  if (isProcessingAI || !previousState) return;

  // Only allow undo on the human player's turn
  const state = controller.getState();
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer?.isHuman) return;

  controller.setState(cloneGameState(previousState));
  selectedTileId = null;
  previousState = null;

  // Re-render and restart the human turn
  const restored = controller.getState();
  tileRenderer.clearAll();
  handTileRenderer.clearAll();

  // Rebuild train row elements
  const trainIds = [...restored.trains.keys()];
  const layout = gridLayout.computeLayout(trainIds, 'player-0');
  gameAreaEl.textContent = '';
  for (const row of layout.trainRows) {
    const rowEl = document.createElement('div');
    rowEl.className = 'train-row';
    rowEl.dataset['trainId'] = row.trainId;
    rowEl.style.height = `${row.height}px`;
    rowEl.addEventListener('click', () => {
      if (selectedTileId !== null && !isProcessingAI) {
        handleTrainClick(row.trainId);
      }
    });
    gameAreaEl.appendChild(rowEl);
  }

  renderState(restored);
  toastManager.show('Undo!');

  // Re-enable controls for the human turn
  sidebar.disableAll();
  const moves = controller.getLegalMovesForCurrentPlayer();
  if (moves.length > 0) {
    handRenderer.highlightPlayable(new Set(moves.map(m => m.tile.id)));
    sidebar.enableButton('sort');
  } else if (restored.boneyard.length > 0) {
    sidebar.enableButton('draw');
    sidebar.pulseButton('draw');
  } else {
    sidebar.enableButton('pass');
  }
}

function processAITurn(state: GameState): void {
  isProcessingAI = true;
  sidebar.disableAll();

  const player = state.players[state.currentPlayerIndex];
  if (!player) return;

  const difficulty = controller.config.difficulty;
  const delay = getAIDelay(difficulty);

  toastManager.show(`${player.name} is thinking...`);

  setTimeout(() => {
    controller.executeAITurn();
    const newState = controller.getState();

    // Log what happened
    const lastAction = newState.turnLog[newState.turnLog.length - 1];
    if (lastAction) {
      if (lastAction.type === 'play' && lastAction.tile) {
        toastManager.show(`${player.name} played [${lastAction.tile.sideA}|${lastAction.tile.sideB}]`);
      } else if (lastAction.type === 'draw') {
        toastManager.show(`${player.name} drew a tile`);
      } else if (lastAction.type === 'mark') {
        toastManager.show(`${player.name}'s train is now open`);
      }
    }

    renderState(newState);
    isProcessingAI = false;

    if (newState.roundOver) {
      handleRoundEnd();
    } else {
      advanceToNextTurn();
    }
  }, delay);
}

function advanceToNextTurn(): void {
  controller.advanceTurn();
  saveGame(controller.getState());
  setTimeout(() => startPlayerTurn(), 200);
}

function handleRoundEnd(): void {
  soundManager.playRoundEnd();
  const state = controller.getState();

  if (state.round >= 12) {
    // Game over — clear saved game
    clearSave();
    const winnerId = state.winnerId ?? 0;
    scoreOverlay.showGameOver(state.players, winnerId);
  } else {
    scoreOverlay.showRoundEnd(state.players, state.round);
  }
}

// --- Event Wiring ---
eventBus.on('ui:newGame', ({ playerCount, difficulty, playerName }) => {
  clearSave();
  startGame(playerCount, difficulty, playerName);
});

eventBus.on('ui:nextRound', () => {
  controller.startNextRound();
  startRound();
});

eventBus.on('ui:restartGame', () => {
  setupScreen.show();
});

eventBus.on('input:drawRequested', () => {
  handleDraw();
});

eventBus.on('input:passRequested', () => {
  handlePass();
});

eventBus.on('input:sortRequested', () => {
  handleSort();
});

eventBus.on('input:undoRequested', () => {
  handleUndo();
});

eventBus.on('ui:soundToggle', () => {
  const enabled = soundManager.toggle();
  sidebar.updateSoundLabel(enabled);
});

eventBus.on('ui:resumeGame', () => {
  const saved = loadGame();
  if (!saved) {
    toastManager.show('No saved game found');
    return;
  }

  // Determine config from saved state
  const playerCount = saved.players.length;
  // Default to medium difficulty for resumed games
  const difficulty: Difficulty = 'medium';
  const playerName = saved.players[0]?.name ?? 'Player';

  controller = new GameController({
    playerCount,
    difficulty,
    playerName,
    firstTurnChainPlay: false,
  });

  controller.setState(saved);

  // Register AI for non-human players
  for (let i = 1; i < playerCount; i++) {
    controller.registerAI(i, createAI(difficulty));
  }

  // Rebuild the board from saved state
  startRound();
});

eventBus.on('input:tileSelected', ({ tileId }) => {
  handleTileClick(tileId);
});

eventBus.on('input:trainSelected', ({ trainId }) => {
  handleTrainClick(trainId);
});

// --- Hand tile click wiring ---
handAreaEl.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const tileEl = target.closest('.tile') as HTMLElement | null;
  if (tileEl?.dataset['tileId']) {
    handleTileClick(parseInt(tileEl.dataset['tileId'], 10));
  }
});

// --- Keyboard ---
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (isProcessingAI) return;

  // Ignore keyboard shortcuts when an input/select/textarea is focused
  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') return;

  if (e.key === ' ') {
    e.preventDefault();
    handleDraw();
  } else if (e.key === 's' || e.key === 'S') {
    handleSort();
  } else if (e.key === 'Escape') {
    selectedTileId = null;
    const state = controller?.getState();
    if (state) renderState(state);
  } else if (e.key >= '1' && e.key <= '9') {
    // Select the nth tile in the human player's hand (1-indexed)
    const index = parseInt(e.key, 10) - 1;
    const state = controller?.getState();
    if (!state) return;
    const human = state.players[0];
    if (!human) return;
    if (index < human.hand.length) {
      const tile = human.hand[index];
      if (tile) {
        handleTileClick(tile.id);
      }
    }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    // Cycle through eligible trains when a tile is selected
    if (selectedTileId === null) return;
    const state = controller?.getState();
    if (!state) return;
    const moves = getLegalMoves(state, state.currentPlayerIndex)
      .filter(m => m.tile.id === selectedTileId);
    if (moves.length === 0) return;

    const eligibleTrainIds = moves.map(m => m.trainId);
    // Find all train row elements in DOM order
    const rows = Array.from(gameAreaEl.querySelectorAll('.train-row')) as HTMLElement[];
    const eligibleRows = rows.filter(r => eligibleTrainIds.includes(r.dataset['trainId'] ?? ''));
    if (eligibleRows.length === 0) return;

    // Find the currently highlighted eligible row (with 'tab-focus' class)
    const currentFocusIndex = eligibleRows.findIndex(r => r.classList.contains('tab-focus'));
    // Remove old focus
    for (const r of eligibleRows) r.classList.remove('tab-focus');

    const nextIndex = (currentFocusIndex + 1) % eligibleRows.length;
    const nextRow = eligibleRows[nextIndex];
    if (nextRow) {
      nextRow.classList.add('tab-focus');
      // If user presses Enter while tab-focused, play on that train
    }
  } else if (e.key === 'Enter') {
    // Play on tab-focused train
    const focusedRow = gameAreaEl.querySelector('.train-row.tab-focus') as HTMLElement | null;
    if (focusedRow?.dataset['trainId'] && selectedTileId !== null) {
      handleTrainClick(focusedRow.dataset['trainId']);
    }
  }
});

// --- Window resize ---
function updateLayout(): void {
  gridLayout.updateFromDOM(gameAreaEl, handAreaEl);
}

window.addEventListener('resize', () => {
  updateLayout();
  const state = controller?.getState();
  if (state) renderState(state);
});

// --- Init ---
// Initial layout update after first render frame
requestAnimationFrame(() => updateLayout());
setupScreen.show();
