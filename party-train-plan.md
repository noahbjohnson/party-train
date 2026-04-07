# Party Train Dominoes — Complete Project Plan

## Overview

Single-player Party Train dominoes game built with PlayCanvas engine (code-first, no editor). Player vs 1–3 AI opponents. Clean 2D top-down aesthetic with horizontal train rows. Runs in the browser.

**Target stack**: PlayCanvas engine (via npm), TypeScript, Vite for bundling, Vitest for testing.

---

## 1. Game Rules — Party Train (Complete Specification)

This section is the canonical reference for all game logic implementation. Every edge case matters.

### 1.1 The Domino Set

- **Double-12 set**: 91 tiles total.
- Each tile has two sides (sideA, sideB), where 0 ≤ sideA ≤ sideB ≤ 12.
- A **double** is a tile where sideA === sideB.
- There are 13 doubles (0-0 through 12-12).
- Total pip count of the entire set: 1,092.

### 1.2 Players and Dealing

| Player count | Tiles dealt per player | Boneyard remaining |
|---|---|---|
| 2 | 15 | 61 |
| 3 | 13 | 52 |
| 4 | 11 | 47 |

The starting double for the round is removed from the set before dealing. If it was dealt to a player, that player places it. If not dealt to anyone, search the boneyard and place it.

### 1.3 Round Structure

- The game consists of **13 rounds**, starting with the 12-12 as the hub double, then 11-11, 10-10, ... down to 0-0.
- Each round:
  1. Remove the round's starting double from the full set and place it in the center hub.
  2. Shuffle remaining 90 tiles.
  3. Deal to each player per the table above.
  4. Remaining tiles form the **boneyard** (draw pile).
  5. Play proceeds clockwise starting with the player who had the starting double (or the player left of the dealer if the double was in the boneyard).
  6. Round ends when a player empties their hand OR all players are blocked (no legal plays, boneyard empty).
  7. Score remaining pips in each player's hand.

### 1.4 The Table Layout

- **Center hub**: The round's starting double sits here.
- **Player trains**: Each player has a personal train that extends outward from the hub. The first tile played on a player's train must match the hub double's value.
- **Party Train**: One shared community train that also extends from the hub. Any player can play on it at any time. The first tile on the Party Train must also match the hub double's value.

### 1.5 Turn Sequence (Critical — Implement Exactly)

On your turn, follow this sequence:

#### Step 1: Check for unsatisfied double
If there is an **unsatisfied double** on the table (a double was played on the previous turn and not yet "satisfied" with a follow-up tile):
- You **must** play on that double's train if you can.
- If you cannot, draw one tile from the boneyard.
- If the drawn tile can satisfy the double, play it.
- If not (or boneyard is empty), mark your train as open and your turn ends.
- **Multiple unsatisfied doubles**: If somehow multiple doubles are unsatisfied (rare but possible — a player plays a double to satisfy a double), the most recently played double takes priority.

#### Step 2: Normal play (no unsatisfied double)
- You may play one tile on any **eligible train**:
  - Your own train (always eligible).
  - The Party Train (always eligible).
  - Any other player's train that has an **open marker** on it.
- The tile must match the open end of the chosen train.
- If you play a **double**, you get a **bonus play** — you must immediately play a second tile (see 1.6).

#### Step 3: Can't play
- If you have no legal play, draw one tile from the boneyard.
- If the drawn tile is playable, you **may** play it immediately.
- If the drawn tile is not playable (or boneyard is empty), place an **open marker** on your train. Your turn ends.

#### Step 4: Open marker removal
- If your train has an open marker and you successfully play a tile on your own train, remove the marker. Your train is now closed to other players again.
- Playing on someone else's train or the Party Train does NOT remove your marker.

### 1.6 Doubles — Detailed Rules

When you play a double:
1. The double is placed **sideways** (perpendicular to the train direction) as a visual indicator.
2. You **must** immediately play a second tile. This second tile can go on **any eligible train** (not necessarily the train you just played the double on).
3. If your second play is ALSO a double, you must play a third tile. This can chain — but in practice, limit to a reasonable depth (3 consecutive doubles max, then force a draw/pass).
4. If you cannot play a second tile after placing the double:
   - Draw from the boneyard.
   - If the drawn tile is playable, play it.
   - If not, mark your train open. The double is now **unsatisfied**.
5. An unsatisfied double means the **next player(s)** must satisfy it before making any other play (see Step 1).
6. A double is **satisfied** when any tile is played matching it on that same train.

### 1.7 Scoring

- At end of round, each player sums the pips on all tiles remaining in their hand.
- The player who went out (empty hand) scores 0 for that round.
- A player caught holding the 0-0 scores 0 for it (it has no pips).
- Running total across all 13 rounds. **Lowest total score wins.**

### 1.8 Edge Cases to Handle

- **Boneyard empty**: Player simply can't draw. If they can't play, they mark their train and pass.
- **All players blocked**: Round ends immediately. Everyone scores their remaining pips.
- **Starting double not dealt**: Find it in the boneyard, place it on the hub. First player is determined by seating order or random.
- **First turn**: On the very first turn of a round, a player may play as many tiles as they can in a chain on their own train (this is a common house rule — **implement as an option**, default OFF).
- **Party Train not started**: The Party Train doesn't exist as a playable train until someone starts it. The first play on it must match the hub value.
- **Player goes out on a double**: Valid. The player wins the round. No need to satisfy the double.

---

## 2. Data Models

All types defined in `src/types.ts`. These are the source of truth.

### 2.1 Tile

```typescript
interface Tile {
  readonly id: number;           // 0–90, unique identifier
  readonly sideA: number;        // 0–12, always sideA <= sideB for canonical form
  readonly sideB: number;        // 0–12
  readonly isDouble: boolean;    // derived: sideA === sideB
  readonly pipCount: number;     // derived: sideA + sideB
}
```

### 2.2 Train

```typescript
interface PlayedTile {
  tile: Tile;
  orientation: 'normal' | 'flipped';  // which side connects to the train
}

interface Train {
  id: string;                          // "player-0", "player-1", ..., "party"
  ownerId: number | null;              // null for Party Train
  tiles: PlayedTile[];                 // ordered list of tiles on this train
  openEnd: number;                     // the pip value at the end that accepts new tiles
  isOpen: boolean;                     // true = any player can play on this train
  hasUnsatisfiedDouble: boolean;       // true = last tile played was a double not yet covered
}
```

### 2.3 Player

```typescript
interface Player {
  id: number;
  name: string;
  hand: Tile[];
  isHuman: boolean;
  trainId: string;              // reference to their train
  score: number;                // running total across rounds
  roundScore: number;           // pips remaining this round
}
```

### 2.4 Game State

```typescript
interface GameState {
  round: number;                              // 0–12 (index), starting double = 12 - round
  hubValue: number;                           // the pip value of the center double (12, 11, 10...)
  players: Player[];
  trains: Map<string, Train>;                 // keyed by train ID
  boneyard: Tile[];                           // face-down draw pile
  currentPlayerIndex: number;
  turnPhase: TurnPhase;                       // see state machine below
  unsatisfiedDoubleTrainId: string | null;    // which train has the open double
  doublesPlayedThisTurn: number;              // count of consecutive doubles
  mustSatisfyDouble: boolean;                 // if true, current player must play on the unsatisfied double's train
  roundOver: boolean;
  gameOver: boolean;
  winnerId: number | null;                    // player ID of overall winner
  turnLog: TurnAction[];                      // for replay/undo
}

type Difficulty = 'easy' | 'medium' | 'hard';
```

### 2.5 Turn Phase State Machine

```typescript
type TurnPhase =
  | 'START_TURN'           // check for unsatisfied double
  | 'MUST_SATISFY_DOUBLE'  // player is forced to play on the double's train
  | 'PLAY_TILE'            // normal: select tile and target train
  | 'BONUS_PLAY'           // just played a double, must play again
  | 'MUST_DRAW'            // no valid play, must draw
  | 'DREW_TILE'            // drew a tile, check if it's playable
  | 'MARK_TRAIN'           // can't play after draw, mark train open
  | 'END_TURN';            // resolve, advance to next player
```

State transitions:

```
START_TURN
  → if unsatisfied double exists: MUST_SATISFY_DOUBLE
  → else: PLAY_TILE

MUST_SATISFY_DOUBLE
  → if player has a matching tile: player plays it → END_TURN
  → if player has no matching tile: MUST_DRAW

PLAY_TILE
  → player plays a non-double: END_TURN
  → player plays a double: BONUS_PLAY
  → player has no valid plays: MUST_DRAW

BONUS_PLAY
  → player plays a non-double: END_TURN
  → player plays another double (chain): BONUS_PLAY (increment counter, max 3)
  → player has no valid play: MUST_DRAW

MUST_DRAW
  → boneyard not empty: draw tile → DREW_TILE
  → boneyard empty: MARK_TRAIN

DREW_TILE
  → drawn tile is playable: player may play it → END_TURN (or BONUS_PLAY if double)
  → drawn tile is not playable: MARK_TRAIN

MARK_TRAIN
  → mark player's train as open → END_TURN

END_TURN
  → if player's hand is empty: end round
  → if all players blocked: end round
  → else: advance currentPlayerIndex → START_TURN
```

---

## 3. AI Opponent Design

### 3.1 AI Strategy Interface

```typescript
interface AIStrategy {
  readonly difficulty: Difficulty;
  choosePlay(state: GameState, playerId: number, legalMoves: LegalMove[]): LegalMove;
}

interface LegalMove {
  tile: Tile;
  trainId: string;
  orientation: 'normal' | 'flipped';
}
```

### 3.2 Difficulty Levels

**Easy (Random Valid)**
- Enumerate all legal plays (tile + target train combinations).
- Pick one at random.
- No strategic consideration.

**Medium (Greedy Heuristic)**
Priority scoring for each legal play:

```
score(tile, targetTrain) =
  + tile.pipCount * 2              // dump high-pip tiles first
  + (tile.isDouble ? -20 : 0)      // avoid playing doubles unless you have a satisfier
  + (targetTrain === ownTrain && ownTrain.isOpen ? +15 : 0)  // close your own train
  + (targetTrain === opponentTrain ? +5 : 0)                  // play on opponents when possible
  + (doublesInHand(matchingValue) ? +10 : 0)                  // okay to double if you can satisfy
```

Pick the highest-scoring play. Add small random jitter (±3) to avoid predictability.

**Hard (Lookahead + Tracking)**
Everything from Medium, plus:
- **Tile tracking**: Maintain a set of all tiles played. Infer what opponents might hold based on what they've drawn and what's been played.
- **Blocking awareness**: If an opponent's train is open, prefer plays that DON'T match their likely tiles.
- **Endgame detection**: When boneyard is low and hands are small, switch to "minimize remaining pips" strategy.
- **Double management**: Hold doubles until you have 2+ tiles that can satisfy them. Don't play a double if it risks getting stuck.
- **1-ply lookahead**: For each candidate play, simulate the resulting state and evaluate your position.

### 3.3 AI Timing

Don't instant-play — add artificial thinking delay:
- Easy: 500–800ms
- Medium: 800–1200ms
- Hard: 1200–2000ms

Animate the AI "considering" tiles (subtle highlight pulse on their face-down hand).

---

## 4. PlayCanvas Rendering Specification

### 4.1 Scene Setup

- **Engine**: PlayCanvas engine via npm (`playcanvas` package).
- **Camera**: Orthographic, looking down (-Y axis). Perfect 2D top-down view.
- **Canvas**: Fill the browser window. Responsive resize handling.
- **Background**: Teal/dark cyan table color (like the reference app). Solid color, not textured.

### 4.2 Tile Rendering

Each domino tile is a rectangular entity:

- **Dimensions**: Roughly 2:1 aspect ratio. In world units, ~1.0 x 0.5 units.
- **Face-up tiles**: White/ivory rectangle with a dividing line across the middle. Pip dots on each half arranged in standard domino pip patterns.
- **Face-down tiles**: Solid color (dark navy or teal) with a subtle pattern.
- **Doubles**: Rendered sideways (rotated 90°) when placed on a train, appearing square-ish.
- **Rendering approach**: Generate tile textures procedurally using a canvas2D offscreen, then apply as PlayCanvas textures/sprites. Create a texture atlas with all 91 tile faces + 1 tile back.

**Color-coded pips** — each pip value gets a distinct color (matching the reference app):
```
0:  gray/dark       (#808080)
1:  red             (#FF0000)
2:  blue            (#0000FF)
3:  green           (#00AA00)
4:  cyan/light blue (#00CCCC)
5:  magenta/pink    (#FF00FF)
6:  brown/dark red  (#AA4400)
7:  orange          (#FF8800)
8:  teal            (#008888)
9:  dark blue/navy  (#000088)
10: yellow/gold     (#CCAA00)
11: white/cream     (#DDDDDD)
12: black           (#222222)
```

Each half of a tile draws its pips in the color corresponding to that half's value. This makes tiles instantly scannable — you can spot matching values by color at a glance.

Pip layout patterns (standard domino dot positions within each half):
```
0: (empty)
1: center
2: top-right, bottom-left
3: top-right, center, bottom-left
4: four corners
5: four corners + center
6: three left, three right (2 columns of 3)
7: three left, three right + center
8: three left, three right + 2 center
9: 3x3 grid
10: 3-4-3 arrangement
11: 4-3-4 arrangement
12: 4-4-4 arrangement (3 columns of 4)
```

### 4.3 Table Layout — Horizontal Grid (Reference Layout)

The table uses a **grid/row-based layout**, NOT a radial layout. Each train is a horizontal row. This matches the standard Party Train app layout.

**Overall structure (top to bottom):**

```
┌──────────┬──────────────────────────────────┬─────────────────────────┐
│          │                                  │  [Hub/Start Double]     │
│          │  AI Player 1 train → → → → →     │  Player1 Name  | Count │
│          │  AI Player 2 train → → → → →     │  Player2 Name  | Count │
│  Action  │  AI Player 3 train → → → → →     │  Player3 Name  | Count │
│  Buttons │  Party Train → → → → →         │  "Party Train"       │
│  (left)  │  Human Player train → → → → →    │  PlayerName    | Count │
│          ├──────────────────────────────────┼─────────────────────────┤
│          │  Human player's hand (2 rows)    │  Bone Pile: NN          │
│          │  [tile][tile][tile][tile][tile]   │  Start Double: [tile]   │
│          │  [tile][tile][tile][tile][tile]   │  Best Train: [icon]     │
└──────────┴──────────────────────────────────┴─────────────────────────┘
```

**Train rows:**
- Each train is a single horizontal row.
- Tiles flow **left-to-right** from the hub/start position.
- The **rightmost column** shows the player name, a color badge, and their tile count (number of tiles remaining in hand).
- The hub (starting double) is conceptually at the right side — trains grow leftward from it. Each train row shows tiles played, scrolling left as the train grows.
- If a train has more tiles than fit on screen, the row scrolls horizontally (or tiles compress slightly).
- The **Party Train** row is labeled distinctly (bold text, maybe a small train icon).
- The **human player's train** is highlighted (different row background or border) and positioned at the bottom of the train area, just above their hand.

**Train markers (open indicator):**
- When a player's train is marked as open, show a colored marker icon (small train token or colored dot) next to the player's name on the right side.
- Use distinct player colors: Player 1 = blue, Player 2 = red, Player 3 = green, Human = yellow/gold.

**Player hand (human):**
- Below the train rows, in a dedicated area.
- Tiles arranged in **up to 2 rows** horizontally (like the reference app).
- Tiles are face-up, slightly larger than train tiles.
- Can be **sorted** by pip value (Sort button functionality).
- Hovering a tile raises it slightly.
- Selected tile gets a highlight border/glow.

**AI hands:**
- NOT displayed as tiles. Shown only as the **count** next to each AI player's name in the right column.

**Info panel (bottom-right):**
- **Bone Pile**: Shows remaining tile count (large number).
- **Start Double**: Shows the current round's starting double tile visually.
- **Best Train indicator**: A traffic light style indicator (green/yellow/red) showing whether the player has a good play available. Green = can play, Yellow = marginal, Red = must draw.

### 4.4 Camera

- Orthographic projection.
- Fixed view — no zoom/pan needed since the grid layout is structured to fit the screen.
- Responsive: recalculate grid cell sizes on window resize.
- If trains grow very long (late-game), the train cells scroll horizontally or tiles scale down to fit.

### 4.5 Animations

All animations via tweens (PlayCanvas `tween.js` library or custom lerp):

- **Tile play**: Tile slides from hand to the train row endpoint. Duration 300ms, ease-out.
- **Tile draw**: Tile slides from boneyard area to player hand. Duration 250ms.
- **Train marker appear/disappear**: Fade in/out + slight scale bounce. Duration 200ms.
- **AI turn**: Brief pause, then tile appears at the end of their train row (slide in from right).
- **Round end**: All remaining tiles in hands flip face-up briefly, then fade. Score tally animates up.
- **Double played**: Brief pulse/highlight effect on the played tile.
- **Hand sort**: Tiles rearrange with a shuffle animation when Sort is pressed.

### 4.6 Visual Style — "Clean 2D"

- Flat shading, no 3D lighting effects.
- Crisp lines, clear pip dots with **color-coded pips** per the palette above.
- Color palette: Teal/dark cyan background, ivory/white tiles, dark divider lines.
- Font: Clean sans-serif for UI text (scores, player names, turn indicators).
- Player name labels with **colored backgrounds** matching their player color.
- Grid lines between train rows (subtle, low-opacity).
- Minimal chrome — functional, not ornate.
- Subtle shadow under tiles for slight depth.

---

## 5. Interaction Design

### 5.1 Human Turn Flow

1. **Turn starts**: Active player's name badge in the right panel pulses/highlights. If there's an unsatisfied double, that train row gets a pulsing border highlight.
2. **Tile selection**: Click a tile in the hand area (bottom). It raises up and highlights. Valid target train rows light up (subtle glow on the row or the endpoint).
3. **Train targeting**: Click a highlighted train row to play the tile there.
   - If valid: animate tile sliding into the train row, update game state.
   - If invalid: brief shake animation, tile returns to hand.
4. **Drawing**: If no valid plays, the Draw button in the left sidebar pulses. Click it to draw. Drawn tile appears in hand with a slide animation.
   - If drawn tile is playable: it auto-highlights, valid trains light up.
   - If not playable: Pass button becomes active, or auto-pass after a brief moment.
5. **Double played**: After playing a double, hand re-highlights for bonus play. Status text shows "Play again!" Toast notification appears.
6. **Turn ends**: De-highlight everything. Brief pause, then AI takes over.

### 5.2 Input Handling

- **Mouse**: Click to select tiles and target trains. Click sidebar buttons for actions.
- **Touch**: Tap to select/place. Tap sidebar buttons.
- **Keyboard shortcuts** (nice to have):
  - Space: Draw from boneyard
  - 1-9: Select nth tile in hand
  - Esc: Deselect current tile
  - Tab: Cycle through valid trains
  - S: Sort hand

### 5.3 Feedback and Communication

- **Toast messages**: Brief text overlays for events ("Michael drew a tile", "Double must be satisfied!", "Andrew's train is now open").
- **Turn indicator**: Active player's name badge highlighted in the right panel.
- **Tile count badges**: Number next to each AI player's name showing tiles in hand.
- **Best train light**: Traffic light indicator updates each turn.
- **Button states**: Sidebar buttons enable/disable contextually. Disabled buttons are grayed out.

---

## 6. UI Overlay

Implement as an HTML/CSS layer on top of the PlayCanvas canvas (not as PlayCanvas Screen entities — HTML is easier for text-heavy UI).

### 6.1 Left Sidebar — Action Buttons (Always Visible)

Vertical stack of large, clearly labeled buttons on the left edge of the screen (matching reference layout):

- **Deal** — Start a new round / re-deal (visible between rounds).
- **Draw** — Draw from boneyard. Enabled only when it's the human player's turn and drawing is valid. Disabled/grayed otherwise.
- **Pass** — Pass turn. Enabled only after drawing when no valid play exists.
- **Menu** — Opens settings/new game overlay.
- **Sort** — Sorts the human player's hand by pip value (various sort modes: by left pip, by right pip, by total).
- **Undo** — Undo the current turn's action (before confirming). Only available during the human player's turn.

Buttons should be large touch-friendly targets (~80px wide), bold text, high contrast. Style them with distinct colors (blue for Draw, red for Pass, etc.) to make them instantly identifiable.

### 6.2 Right Panel — Player Info (Always Visible)

Right column showing:
- **Per train row**: Player name (with colored background), tile count in hand, open train marker (if applicable).
- **Party Train label**: Distinct styling, no tile count.
- **Human player row**: Highlighted differently (gold/yellow background on name).
- **Active player**: The current player's name badge pulses or has a bright border.

### 6.3 Bottom-Right Info Panel

- **Bone Pile**: Large count of remaining boneyard tiles.
- **Start Double**: Visual display of the current round's starting double tile.
- **Best Train indicator**: Traffic light icon (green = you have a good play, yellow = marginal, red = must draw). This is a helper hint for the player.

### 6.4 Top Bar (Minimal)

- **Round indicator**: "Round 3 of 13" with the hub value.
- **Running scores**: Compact score summary for all players.

### 6.5 Modals / Overlays

- **New game setup**: Player count (2-4), difficulty (easy/medium/hard), player names input.
- **Round end**: Scoreboard showing this round's scores + running totals. "Next Round" button.
- **Game over**: Final scores, winner announcement, "Play Again" button.
- **Rules reference**: Accessible help screen with Party Train rules summary.
- **Settings**: Sound toggle, animation speed, optional house rules (first-turn chain play).

### 6.6 Status / Toast Area

- Context-sensitive status text below the hand area or above the action buttons:
  - "Select a tile from your hand"
  - "Choose a train to play on"
  - "You must satisfy the double!"
  - "Michael drew a tile"
  - "Andrew's train is now open"
- Brief toast notifications for game events, auto-dismiss after 2-3 seconds.

---

## 7. Project Structure

```
party-train/
├── index.html                    # Entry point
├── vite.config.ts                # Vite bundler config
├── tsconfig.json                 # TypeScript config (strict mode)
├── package.json
├── src/
│   ├── main.ts                   # Bootstrap PlayCanvas app, wire everything
│   ├── types.ts                  # Shared type definitions, interfaces, enums
│   ├── game/                     # Pure game logic (no engine dependency)
│   │   ├── Tile.ts               # Tile class
│   │   ├── TileSet.ts            # Generate and manage double-12 set
│   │   ├── Train.ts              # Train class
│   │   ├── Player.ts             # Player class
│   │   ├── GameState.ts          # Central game state
│   │   ├── TurnManager.ts        # State machine for turn phases
│   │   ├── RuleEngine.ts         # Validate plays, compute legal moves
│   │   ├── RoundManager.ts       # Round lifecycle, dealing, scoring
│   │   ├── GameController.ts     # Orchestrator: ties state + turns + rules
│   │   └── ai/
│   │       ├── AIStrategy.ts     # AI strategy interface
│   │       ├── RandomAI.ts       # Easy difficulty
│   │       ├── GreedyAI.ts       # Medium difficulty
│   │       └── StrategicAI.ts    # Hard difficulty
│   ├── engine/                   # PlayCanvas rendering layer
│   │   ├── SceneSetup.ts         # Camera, lighting, table background
│   │   ├── TileRenderer.ts       # Tile texture generation + entity creation
│   │   ├── TileAtlas.ts          # Procedural texture atlas (color-coded pips)
│   │   ├── TrainRowRenderer.ts   # Render train rows in horizontal grid
│   │   ├── HandRenderer.ts       # Player hand display (bottom area, 2 rows)
│   │   ├── GridLayout.ts         # Compute grid cell positions, sizing, scrolling
│   │   ├── AnimationManager.ts   # Tween-based animations
│   │   ├── InputHandler.ts       # Click/tap → game actions
│   │   └── PlayerInfoRenderer.ts # Right column: names, counts, markers
│   ├── ui/                       # HTML overlay UI
│   │   ├── Sidebar.ts            # Left action buttons (Deal, Draw, Pass, Sort, Undo)
│   │   ├── PlayerPanel.ts        # Right player info column
│   │   ├── InfoPanel.ts          # Bottom-right: bone pile, start double, best train
│   │   ├── TopBar.ts             # Round indicator, scores
│   │   ├── ScoreOverlay.ts       # Round-end and game-end screens
│   │   ├── SetupScreen.ts        # New game configuration
│   │   ├── ToastManager.ts       # Notification toasts
│   │   └── styles.css            # UI styles
│   ├── audio/                    # Sound effects (optional polish)
│   │   └── SoundManager.ts
│   └── utils/
│       ├── EventBus.ts           # Typed pub/sub for decoupling game ↔ render
│       └── Constants.ts          # Magic numbers, colors, pip color palette, timings
├── assets/
│   └── textures/                 # Table felt, tile textures if pre-made
└── tests/
    ├── Tile.test.ts
    ├── TileSet.test.ts
    ├── Train.test.ts
    ├── RuleEngine.test.ts
    ├── TurnManager.test.ts
    ├── RoundManager.test.ts
    └── AI.test.ts
```

### TypeScript Configuration

Use `strict: true` in tsconfig.json. Key settings:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "sourceMap": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

The `types.ts` file should contain all shared interfaces and enums used across game, engine, and UI layers. This is the single source of truth for the type system — no duplicating type definitions across files.

---

## 8. Event Bus — Communication Contract

The game logic and rendering layers communicate via a **typed EventBus**. Neither layer imports the other directly. All event payloads are defined as TypeScript interfaces in `types.ts`.

### Game → Renderer events:
```typescript
'tile:played'        { tile: Tile, trainId: string, position: number, isDouble: boolean }
'tile:drawn'         { playerId: number, tile: Tile | null, boneyardRemaining: number }
'train:markerSet'    { trainId: string, isOpen: boolean }
'turn:start'         { playerId: number, mustSatisfyDouble: boolean, doubleTrainId: string | null }
'turn:end'           { playerId: number }
'round:start'        { roundNumber: number, hubValue: number, playerHands: Map<number, Tile[]>, boneyardCount: number }
'round:end'          { scores: Map<number, number>, runningTotals: Map<number, number> }
'game:over'          { winnerId: number, finalScores: Map<number, number> }
'ai:thinking'        { playerId: number }
'ai:decided'         { playerId: number }
'hand:updated'       { playerId: number, hand: Tile[] }
'legalMoves:updated' { moves: Array<{ tile: Tile, trainId: string }> }
'bestTrain:updated'  { status: 'green' | 'yellow' | 'red' }
```

### Renderer → Game events:
```typescript
'input:tileSelected'    { tileId: number }
'input:trainSelected'   { trainId: string }
'input:drawRequested'   {}
'input:passRequested'   {}
'input:undoRequested'   {}
'input:sortRequested'   { mode: 'left' | 'right' | 'total' }
```

### UI → Game events:
```typescript
'ui:newGame'            { playerCount: number, difficulty: Difficulty, playerName: string }
'ui:nextRound'          {}
'ui:restartGame'        {}
```

### EventBus implementation note:
Use a generic typed EventBus class:
```typescript
type EventMap = {
  'tile:played': { tile: Tile; trainId: string; position: number; isDouble: boolean };
  // ... all events
};

class EventBus {
  on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): void;
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
  off<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): void;
}
```
This gives compile-time safety — no typos in event names, no wrong payload shapes.

---

## 9. Build Order — Phase Sequence

### Phase 1: Core Game Logic (No Rendering)

Goal: Fully playable game in the console with all rules correct.

1. `types.ts` — All shared interfaces, enums, type aliases. Define Tile, Train, Player, GameState, TurnPhase, Difficulty, and all event payload types here first.
2. `Tile.ts` + `TileSet.ts` — Generate the 91-tile double-12 set. Unit test completeness.
3. `Train.ts` — Train data structure. Test adding tiles, checking open end, marker state.
4. `Player.ts` — Hand management, score tracking.
5. `RuleEngine.ts` — `getLegalMoves(gameState, playerId)` → returns all valid (tile, train) pairs. This is the most critical function. Test exhaustively:
   - Normal play on own train
   - Play on Party Train
   - Play on opponent's open train
   - Forced play on unsatisfied double
   - No legal moves → must draw
   - Double bonus play scenarios
6. `TurnManager.ts` — State machine implementing the turn flow from section 2.5. Test all transitions.
7. `RoundManager.ts` — Deal, find starting double, detect round end, score.
8. `GameController.ts` — Wire it all together. Run a full game with random AI, log to console.
9. `RandomAI.ts` — Simplest AI, picks random legal move.
10. **Milestone**: Run 1000 automated games with 4 random AI players. Verify no crashes, no illegal states, scores always sum correctly.

### Phase 2: AI Improvements

1. `GreedyAI.ts` — Heuristic scoring.
2. `StrategicAI.ts` — Tile tracking, lookahead, endgame awareness.
3. **Milestone**: Pit AI difficulties against each other over 1000 games. Hard should win significantly more than Easy.

### Phase 3: PlayCanvas Scene

1. `SceneSetup.ts` — Create PlayCanvas app, orthographic camera, teal table background.
2. `TileAtlas.ts` — Procedural tile texture generation with color-coded pips. Render all 91 tile faces + back as a sprite atlas.
3. `TileRenderer.ts` — Create PlayCanvas entities from the atlas for individual tiles.
4. `GridLayout.ts` — Compute the grid layout: train row positions, cell sizes, hand area bounds, sidebar/info panel areas. This is the geometric backbone.
5. `TrainRowRenderer.ts` — Render each train as a horizontal row of tiles within the grid.
6. `HandRenderer.ts` — Display human player's hand in the bottom area (2 rows, sortable).
7. `PlayerInfoRenderer.ts` — Right column: player names, tile counts, train markers.
8. **Milestone**: Static rendering of a mid-game state. All tiles visible, trains in rows, player info correct.

### Phase 4: Interaction + Event Bus

1. `EventBus.ts` — Typed pub/sub system.
2. `InputHandler.ts` — Tile click → select, train row click → play. Draw button → draw.
3. Wire game events to renderer (tile played → animate tile into train row).
4. Wire input events to game (player clicks → game processes move).
5. `AnimationManager.ts` — Tweens for tile placement, drawing, sort.
6. **Milestone**: Play a full round against AI with visual feedback.

### Phase 5: UI Overlay

1. `Sidebar.ts` — Left action buttons (Deal, Draw, Pass, Menu, Sort, Undo).
2. `PlayerPanel.ts` — Right column player info.
3. `InfoPanel.ts` — Bottom-right: bone pile count, start double display, best train indicator.
4. `TopBar.ts` — Round indicator, running scores.
5. `ToastManager.ts` — Event notifications.
6. `SetupScreen.ts` — New game configuration.
7. `ScoreOverlay.ts` — Round-end and game-end screens.
8. **Milestone**: Complete game loop from setup to game over with full UI.

### Phase 6: Polish

1. Sound effects (tile clack, draw, marker, round end).
2. AI thinking animation (pulse on their tile count).
3. Refined animations (tile slide, flip, sort shuffle).
4. Mobile touch support + responsive grid.
5. Save/load game state (localStorage).
6. Performance optimization (texture atlasing, entity pooling).
7. Rules help overlay.
8. Hand sorting modes (by left pip, right pip, total, color).

### Phase 7: Deployment (Cloudflare Pages)

Deployment is via Cloudflare Pages. No CI/CD config, no workflow YAML — Cloudflare connects directly to the GitHub repo and auto-builds on every push.

**One-time setup (human):**
1. Log into Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git.
2. Select the `party-train` repo and branch (`main`).
3. Framework preset: select **Vite**.
4. Build command: `npm run build`
5. Build output directory: `dist`
6. Click "Save and Deploy".

That's it. Every subsequent push to `main` auto-deploys. Preview deployments are created for PRs automatically.

**URL**: The app will be live at `https://party-train.pages.dev` (or whatever project name you choose). Custom domain can be added later in the Cloudflare dashboard.

**Vite config note**: Unlike GitHub Pages, Cloudflare Pages serves from the root — no `base` path adjustment needed in `vite.config.ts`. Keep `base: '/'` (the default).

**Milestone**: Push to main → Cloudflare builds → game is live and playable at the `.pages.dev` URL.

---

## 10. Testing Strategy

### Unit Tests (game logic)

- **TileSet**: Generates exactly 91 tiles, all unique, correct pip counts.
- **Train**: Adding tiles updates openEnd correctly. Marker toggling. Double detection.
- **RuleEngine**: Exhaustive scenarios:
  - Can play matching tile on own train → legal.
  - Can't play non-matching tile → illegal.
  - Can play on open opponent train → legal.
  - Can't play on closed opponent train → illegal.
  - Forced to satisfy unsatisfied double → only that train is legal.
  - Double bonus play → second play on any eligible train.
  - No legal moves → empty result (triggers draw).
- **TurnManager**: State transitions match the spec. No invalid phase transitions.
- **RoundManager**: Correct dealing counts. Hub double found. Round-end detection. Scoring.
- **Full game simulation**: 10,000 games with random players. Assert: no exceptions, all rounds complete, scores non-negative, winner determined.

### Integration Tests (once rendering is wired)

- Play a tile → visual position matches game state.
- Draw a tile → hand count increases, boneyard decreases.
- AI turn → tile appears on table after animation.
- Round end → score overlay shows correct values.

---

## 11. Key Implementation Notes

### Tile matching
A tile (A|B) can be played with either side connecting. If a train's open end is 7, a tile (3|7) connects with the 7 side, and the new open end becomes 3. A tile (7|5) connects with the 7 side, new open end is 5. Don't forget tiles are symmetric — (3|7) and (7|3) are the same tile.

### Grid layout geometry
The table uses a structured grid. The `GridLayout` class computes all positions:

```typescript
interface GridConfig {
  sidebarWidth: number;     // left action buttons (~100px)
  infoPanelWidth: number;   // right player info (~200px)
  handAreaHeight: number;   // bottom hand area (~150px)
  topBarHeight: number;     // top bar (~40px)
  trainRowHeight: number;   // height per train row
  tileWidth: number;        // rendered tile width in pixels
  tileHeight: number;       // rendered tile height in pixels
  tilePadding: number;      // gap between tiles in a row
}

// Train area = full width minus sidebar and info panel
// trainAreaWidth = canvasWidth - sidebarWidth - infoPanelWidth
// Each train row gets trainRowHeight pixels
// Tiles within a row: x = trainAreaStart + (tileIndex * (tileWidth + tilePadding))
// If tiles overflow the row width, either compress tile size or scroll horizontally
```

Train rows are stacked vertically:
```
Row 0: AI Player 1 train
Row 1: AI Player 2 train
Row 2: AI Player 3 train
Row 3: Party Train
Row 4: Human player train
```

The human player's train is always the last row before the hand area, keeping it closest to the hand for visual continuity.

### Texture atlas generation
Use an offscreen HTML canvas to draw all tile faces with color-coded pips:
```typescript
const PIP_COLORS: Record<number, string> = {
  0: '#808080', 1: '#FF0000', 2: '#0000FF', 3: '#00AA00',
  4: '#00CCCC', 5: '#FF00FF', 6: '#AA4400', 7: '#FF8800',
  8: '#008888', 9: '#000088', 10: '#CCAA00', 11: '#DDDDDD',
  12: '#222222'
};

// For each tile:
//   Draw rounded rect (ivory fill, dark border)
//   Draw center dividing line
//   Draw pip dots for sideA in top half using PIP_COLORS[sideA]
//   Draw pip dots for sideB in bottom half using PIP_COLORS[sideB]
//   Copy to atlas at (col * tileWidth, row * tileHeight)
```
Load atlas into PlayCanvas as a Texture, create sprite assets from atlas regions.

### PlayCanvas orthographic setup
```typescript
const camera = new pc.Entity('camera');
camera.addComponent('camera', {
  projection: pc.PROJECTION_ORTHOGRAPHIC,
  orthoHeight: 10,  // adjust to fit table grid
  nearClip: 0.1,
  farClip: 100,
  clearColor: new pc.Color(0.0, 0.55, 0.55) // teal table color
});
camera.setPosition(0, 20, 0);
camera.setEulerAngles(-90, 0, 0); // look straight down
```

### Hand sorting
The Sort button cycles through sort modes:
```typescript
type SortMode = 'left' | 'right' | 'total' | 'color';

function sortHand(hand: Tile[], mode: SortMode): Tile[] {
  switch (mode) {
    case 'left':  return [...hand].sort((a, b) => a.sideA - b.sideA || a.sideB - b.sideB);
    case 'right': return [...hand].sort((a, b) => a.sideB - b.sideB || a.sideA - b.sideA);
    case 'total': return [...hand].sort((a, b) => b.pipCount - a.pipCount);
    case 'color': return [...hand].sort((a, b) => a.sideA - b.sideA); // group by left pip value
  }
}
```

### Best train indicator
The traffic light icon logic:
```typescript
function computeBestTrainStatus(legalMoves: LegalMove[]): 'green' | 'yellow' | 'red' {
  if (legalMoves.length === 0) return 'red';       // must draw
  if (legalMoves.length >= 3) return 'green';       // plenty of options
  return 'yellow';                                    // limited options
}
```

### Performance considerations
- **Entity pooling**: Pre-create tile entities and reuse them across rounds rather than destroying/creating.
- **Batch rendering**: Group static tiles into render batches.
- **Texture atlas**: Single draw call for all tiles.
- **Event throttling**: Don't fire render updates every frame — only on state changes.
- **Grid recalculation**: Only recompute layout on window resize, not every frame.

---

## 12. Optional Future Enhancements

These are NOT part of the initial build but worth designing for:

- **Multiplayer** (WebSocket): The game logic layer is already decoupled. Add a network transport that replaces local AI with remote players.
- **Other variants**: The rule engine can be extended for Block, Draw, All Fives, etc.
- **PlayCanvas Editor migration**: Once the code-first version works, import it into the PlayCanvas Editor for visual scene editing, drag-and-drop asset management, and the visual script graph.
- **Replay system**: The turnLog in GameState can be used to replay entire games.
- **Statistics tracking**: Win rates per difficulty, average scores, longest trains, etc.
- **Themes**: Different table textures, tile styles (classic ivory, modern minimal, wooden).

---

## 13. Claude Code Coordination Strategy

This section defines how to work with Claude Code across sessions, how to parallelize work for speed, and how to maintain context continuity throughout the project.

### 13.1 CLAUDE.md — Project Root Context

Create a `CLAUDE.md` at the project root. This file is read automatically at the start of every Claude Code session, providing persistent context without re-explanation. Keep it under 200 lines — a bloated CLAUDE.md is a token tax on every session.

```markdown
# Party Train Dominoes

## Project overview
Single-player Party Train (Mexican Train variant) dominoes game.
PlayCanvas engine, TypeScript, Vite, Vitest.

## Architecture
- `src/game/` — Pure game logic. No engine imports. Testable standalone.
- `src/engine/` — PlayCanvas rendering layer. Communicates with game via EventBus.
- `src/ui/` — HTML/CSS overlay UI (sidebar, panels, modals).
- `src/types.ts` — Single source of truth for all shared types.
- `src/utils/EventBus.ts` — Typed pub/sub. Game and engine never import each other.

## Key commands
- `npm run dev` — Start Vite dev server
- `npm run test` — Run Vitest
- `npm run test:sim` — Run 1000 automated game simulations
- `npm run build` — Production build
- `npm run typecheck` — tsc --noEmit

## Code conventions
- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)
- All shared types in `src/types.ts` — no duplicating type definitions
- Game logic must have zero PlayCanvas imports
- Event-driven communication only between layers
- Tests alongside implementation — write tests as you build

## Current status
<!-- Update this section at the end of every session -->
Phase: [current phase]
Last completed: [what was finished]
Next up: [what to do next]
Blocked on: [anything blocking]

## File ownership (for parallel work)
<!-- Prevent merge conflicts by assigning file ownership to agents -->
<!-- Example: "Agent 1 owns src/game/*, Agent 2 owns src/engine/*" -->
```

**Critical**: Update the "Current status" section at the end of every session. This is the cheapest form of cross-session continuity. A fresh session reads CLAUDE.md and immediately knows where to pick up.

### 13.2 Session Naming and Continuity

Use named sessions to maintain context across work periods:

```bash
# Start a named session for each phase/feature
claude -n "phase1-game-logic"
claude -n "phase1-rule-engine"
claude -n "phase3-tile-renderer"

# Resume where you left off
claude --resume "phase1-game-logic"

# Or just continue the most recent session
claude --continue
```

**Session naming convention**: `phase{N}-{component}` (e.g., `phase1-turn-manager`, `phase3-grid-layout`, `phase5-sidebar-ui`).

**Handoff protocol** — at the end of every session, before closing:

1. Ask Claude Code: *"Update CLAUDE.md current status and draft a handoff summary."*
2. Claude updates the status block and writes a brief summary of what was done, decisions made, and what's next.
3. The next session (or a parallel agent) reads CLAUDE.md and picks up cleanly.

For long sessions, use `/compact` proactively at ~60% context usage:
```
/compact "Keep the type definitions, test results, and architectural decisions. Discard debugging exploration."
```

### 13.3 Parallel Work Strategy

This project's architecture — game logic, rendering, and UI are decoupled by design — makes it ideal for parallel agent work. The key principle: **one file, one owner**. Never let two agents edit the same file simultaneously.

**Recommended approach: Git worktrees with subagents.**

For this project's size (not a massive codebase), subagents with worktree isolation are the right tool. Agent teams add coordination overhead that isn't justified until you need inter-agent communication, which this project largely doesn't — the layers communicate via a well-defined EventBus contract, not shared file edits.

```bash
# Launch parallel agents with worktree isolation
claude --worktree phase1-core-logic
claude --worktree phase1-ai-engine
claude --worktree phase3-renderer
```

Or within a session, use subagent definitions with worktree isolation:
```yaml
---
name: game-logic-agent
isolation: worktree
---
Implement the game logic layer in src/game/ following the plan in party-train-plan.md.
Focus on: Tile.ts, TileSet.ts, Train.ts, Player.ts, RuleEngine.ts.
Run tests after each module. Do not touch any files outside src/game/ and tests/.
```

### 13.4 Parallelism Map — What Can Run Simultaneously

This is the critical section. Each cell below shows what can be built in parallel at each phase, with explicit file ownership boundaries.

**Phase 1 — Game Logic (3 parallel agents)**

| Agent | Owns | Depends on | Milestone |
|---|---|---|---|
| Agent A: Core models | `types.ts`, `Tile.ts`, `TileSet.ts`, `Train.ts`, `Player.ts` | Nothing — start here first | All model tests pass |
| Agent B: Rules + Turns | `RuleEngine.ts`, `TurnManager.ts` | Needs types.ts + models from Agent A (wait for commit) | getLegalMoves passes all scenarios |
| Agent C: Round + Controller | `RoundManager.ts`, `GameController.ts` | Needs Agent A + B (start after both commit) | Full game simulation runs |

**Sequencing**: Agent A starts immediately. Agent B starts after Agent A commits types.ts and models (~30 min). Agent C starts after both A and B commit. The AI agents (RandomAI, GreedyAI, StrategicAI) can start as soon as RuleEngine is committed.

```
Timeline (Phase 1):
t=0     Agent A: types.ts + Tile + TileSet + Train + Player
t=30m   Agent B: RuleEngine + TurnManager (reads Agent A's committed types)
t=30m   Agent A2: RandomAI.ts (after models committed)
t=60m   Agent C: RoundManager + GameController (reads A + B)
t=60m   Agent B2: GreedyAI + StrategicAI
t=90m   Integration: Wire together, run 1000-game simulation
```

**Phase 2 — AI (2 parallel agents)**

| Agent | Owns | Depends on |
|---|---|---|
| Agent A: GreedyAI | `GreedyAI.ts`, AI test suite | Phase 1 complete |
| Agent B: StrategicAI | `StrategicAI.ts` | Phase 1 complete |

These are fully independent — different files, same interface. Perfect parallel work.

**Phase 3 — Rendering (3 parallel agents)**

| Agent | Owns | Depends on |
|---|---|---|
| Agent A: Tile visuals | `TileAtlas.ts`, `TileRenderer.ts` | types.ts only |
| Agent B: Layout + Trains | `GridLayout.ts`, `TrainRowRenderer.ts`, `PlayerInfoRenderer.ts` | types.ts only |
| Agent C: Hand + Scene | `HandRenderer.ts`, `SceneSetup.ts` | types.ts only |

All three rendering agents only need `types.ts` — they don't need the game logic to be running. They build entities and position them based on the data shapes defined in types. Wire-up to real game state happens in Phase 4.

**Phase 4 — Integration (mostly serial)**

This phase wires the layers together. Mostly serial because it's touching the glue code (EventBus, InputHandler, AnimationManager) that connects everything. One agent, focused session.

**Phase 5 — UI (2-3 parallel agents)**

| Agent | Owns | Depends on |
|---|---|---|
| Agent A: Sidebar + ActionBar | `Sidebar.ts`, `styles.css` (sidebar section) | Phase 4 wiring |
| Agent B: Panels + TopBar | `PlayerPanel.ts`, `InfoPanel.ts`, `TopBar.ts` | Phase 4 wiring |
| Agent C: Modals + Toasts | `ScoreOverlay.ts`, `SetupScreen.ts`, `ToastManager.ts` | Phase 4 wiring |

UI agents own non-overlapping HTML components. Styles can conflict — assign CSS ownership clearly (e.g., Agent A owns `.sidebar-*` classes, Agent B owns `.panel-*`).

**Phase 6 — Polish (fully parallel)**

Sound, animations, mobile touch, save/load, help overlay — all independent features. Launch as many agents as you want.

### 13.5 Practical Workflow — Putting It Together

**Solo developer with Claude Code (recommended for this project):**

1. **Start**: Create the repo, write `CLAUDE.md`, commit `party-train-plan.md` to the repo root.
2. **Phase 1 kickoff**: Open 2-3 terminal panes. Launch worktrees:
   ```bash
   claude --worktree phase1-models -n "phase1-models"
   # In this session: "Read party-train-plan.md. Implement Phase 1 Agent A:
   # types.ts, Tile.ts, TileSet.ts, Train.ts, Player.ts with full test coverage."
   ```
3. **Review and merge**: When an agent finishes (watch for the notification), review the diff, merge to main:
   ```bash
   cd .claude/worktrees/phase1-models
   git diff main
   # If good:
   git checkout main && git merge phase1-models
   ```
4. **Next wave**: Launch the next agents that depend on the merged code.
5. **Between phases**: Update `CLAUDE.md` status, commit it.

**Key rules for parallel work:**
- Never let two agents touch the same file. The file ownership tables above are the law.
- Each agent should run tests for its own modules before committing.
- The "integration agent" (Phase 4) runs after all parallel agents have merged.
- Keep agents to 3-5 concurrent maximum — more than that and review becomes the bottleneck.
- When an agent finishes, review the diff before merging. Don't auto-merge.

### 13.6 Context Recovery

If a session gets long or confused:

- **Soft reset**: `/compact "Keep type definitions, test results, and current task progress. Discard exploration."`
- **Hard reset**: `/clear` then start fresh — CLAUDE.md provides continuity.
- **Session swap**: `claude --resume "phase1-rule-engine"` to return to a specific workstream.

If Claude starts forgetting earlier decisions, repeating itself, or contradicting the architecture, that's context saturation. Compact or start a fresh session immediately — don't push through.

### 13.7 Test-Driven Verification Across Agents

Each agent must leave behind passing tests as proof of correctness. When the integration agent (Phase 4) begins, it runs the full test suite first:

```bash
npm run test          # All unit tests from all agents
npm run test:sim      # 1000-game simulation
npm run typecheck     # Full TypeScript check
```

If anything fails, the integration agent fixes it before wiring layers together. Tests are the contract between parallel agents — they verify that independently-built modules compose correctly.

---

## 14. Human Intervention Map

This section lists every task across the entire project lifecycle — from repo creation to deployment — that requires a human. Everything not listed here is fully automated by Claude Code.

**Legend**: 🔴 = only you can do this, 🟡 = Claude does it / you verify, 🟣 = judgment call needed

### 14.1 Setup (Before Any Code)

| # | Task | Type | Why |
|---|---|---|---|
| 1 | Create GitHub repo and clone locally | 🔴 human | Auth required. `gh repo create` needs your GitHub credentials. |
| 2 | Write initial CLAUDE.md and commit plan to repo | 🔴 human | This is the seed context. Claude Code reads it, but you define the starting truth. |
| — | `npm init`, install deps, configure tsconfig/vite/vitest | auto | Claude Code handles this from the plan spec. |
| — | Scaffold project directory structure | auto | Deterministic from the plan. No judgment needed. |

### 14.2 Phase 1 — Game Logic

| # | Task | Type | Why |
|---|---|---|---|
| — | Implement all game logic modules + tests | auto | Rules are fully specified in this plan. Claude Code writes and runs tests. |
| 3 | Review diffs from parallel worktree agents before merging | 🟡 review | Each worktree agent produces a branch. You review the diff, then merge. |
| 4 | Verify 1000-game simulation results | 🟡 review | Claude runs it, but you check: no crashes, scores make sense, no infinite loops. |
| 5 | Rule ambiguities — house rule decisions | 🟣 decide | If Claude hits an edge case not covered in the plan (e.g., triple-double chain max), you decide. |

### 14.3 Phase 2 — AI Opponents

| # | Task | Type | Why |
|---|---|---|---|
| — | Implement all AI difficulty levels + tests | auto | Strategy is specified in the plan. |
| 6 | Review AI vs AI simulation stats | 🟡 review | Hard AI should win more than Easy. You eyeball the win rates to confirm. |

### 14.4 Phase 3 — Rendering

| # | Task | Type | Why |
|---|---|---|---|
| — | Implement tile atlas, grid layout, renderers | auto | Layout spec is detailed enough for full automation. |
| 7 | Merge parallel rendering agent branches | 🟡 review | Standard diff review before merge. |
| 8 | Visual spot-check: do tiles look right? Are pips readable? | 🔴 human | Procedural texture generation can produce subtle visual bugs. You need to actually look at it. |
| 9 | Tile size, spacing, and color tuning | 🟣 decide | The plan specifies colors but actual rendered feel is subjective. Pip colors might need tweaking for contrast. |

### 14.5 Phase 4 — Integration

| # | Task | Type | Why |
|---|---|---|---|
| — | Wire EventBus, InputHandler, AnimationManager | auto | Glue code follows the event contract in Section 8. |
| 10 | Playtest: actually play a full round against AI | 🔴 human | No automated test replaces a human playing the game. Does it feel right? Are turns intuitive? Is the double-satisfaction flow confusing? |
| 11 | Animation timing and feel | 🟣 decide | 300ms slide might feel sluggish or snappy — only playing it tells you. |

### 14.6 Phase 5 — UI Overlay

| # | Task | Type | Why |
|---|---|---|---|
| — | Implement sidebar, panels, modals, toasts | auto | UI spec is detailed enough. |
| 12 | Merge parallel UI agent branches | 🟡 review | Standard diff review. |
| 13 | UX review: button sizes, label clarity, mobile layout | 🔴 human | UI/UX quality is a judgment call. Are the buttons big enough? Is the scoreboard readable? |

### 14.7 Phase 6 — Polish

| # | Task | Type | Why |
|---|---|---|---|
| — | Sound effects, save/load, mobile touch, help overlay | auto | Independent features, fully automatable. |
| 14 | Full playthrough: play 2-3 complete rounds start to finish | 🔴 human | The "is it fun" test. No substitute for actually playing. |
| 15 | Sound effect selection / volume balance | 🟣 decide | Tile clack loudness, train whistle pitch — pure taste. |

### 14.8 Deployment

| # | Task | Type | Why |
|---|---|---|---|
| — | Production build (`npm run build`) | auto | One command. |
| 16 | Connect repo to Cloudflare Pages (one-time) | 🔴 human | Log into Cloudflare dashboard, select repo, pick Vite preset, click deploy. ~2 minutes. |
| 17 | Custom domain (optional) | 🟣 decide | If you want something other than `party-train.pages.dev` — add it in Cloudflare dashboard. |
| — | Subsequent deploys via git push | auto | Every push to `main` auto-deploys. Preview deploys on PRs. No human needed. |

### 14.9 Ongoing

| Task | Type | Why |
|---|---|---|
| Bug reports from actual play sessions | 🔴 human | You find bugs by playing. Claude fixes them. |
| Feature prioritization for future versions | 🟣 decide | Multiplayer? New variants? Themes? Only you know what you want next. |

### 14.10 Summary

**Total human touchpoints: 17**

| Category | Count | Your time estimate |
|---|---|---|
| 🔴 Auth / credentials | 2 | 10 min total |
| 🟡 Code review gates | 5 | ~10 min each = 50 min total |
| 🟣 Design judgment calls | 5 | ~5 min each = 25 min total |
| 🔴 Visual / UX checks | 2 | ~15 min each = 30 min total |
| 🔴 Playtesting | 3 | ~20 min each = 60 min total |

**Estimated total human time: ~3 hours** across the entire project, spread over multiple sessions. The rest — all code, tests, scaffolding, texture generation, AI implementation, build config — is fully automated by Claude Code.

Your role is **reviewer + playtester**, not coder. The spec is detailed enough that Claude Code should rarely need to ask you a question. When it does, it should be a genuine ambiguity (Section 1.8 edge cases) or a taste decision (animation speed, pip colors).
