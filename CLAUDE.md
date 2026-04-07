# Party Train Dominoes

## Project overview
Single-player Party Train (Mexican Train variant) dominoes game.
PlayCanvas engine (code-first, no editor), TypeScript, Vite, Vitest.
Player vs 1-3 AI opponents. Clean 2D top-down aesthetic with horizontal train rows.

## Architecture
- `src/game/` — Pure game logic. No engine imports. Testable standalone.
- `src/engine/` — PlayCanvas rendering layer. Communicates with game via EventBus.
- `src/ui/` — HTML/CSS overlay UI (sidebar, panels, modals).
- `src/types.ts` — Single source of truth for all shared types.
- `src/utils/EventBus.ts` — Typed pub/sub. Game and engine never import each other.
- `party-train-plan.md` — Complete project plan. Canonical reference for all game rules, data models, AI design, rendering spec, and build phases.

## Key commands
- `npm run dev` — Start Vite dev server
- `npm run test` — Run Vitest
- `npm run test:sim` — Run 1000 automated game simulations
- `npm run build` — Production build (typecheck + vite build)
- `npm run typecheck` — tsc --noEmit

## Code conventions
- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)
- All shared types in `src/types.ts` — no duplicating type definitions
- Game logic must have zero PlayCanvas imports
- Event-driven communication only between layers (EventBus)
- Tests alongside implementation — write tests as you build
- Double-12 set: 91 tiles, 13 rounds (12-12 down to 0-0)

## Game rules quick reference
- See `party-train-plan.md` Section 1 for complete rules
- Turn sequence: check unsatisfied double -> normal play -> can't play -> draw -> mark train
- Doubles grant bonus play; unsatisfied doubles must be covered by next player(s)
- Party Train is always open to all players
- Lowest total score across 13 rounds wins

## Current status
Phase: 0 — Scaffolding
Last completed: Project scaffold (folder structure, npm, configs, CLAUDE.md)
Next up: Phase 1 — Core game logic (types.ts, Tile, TileSet, Train, Player, RuleEngine, TurnManager, RoundManager, GameController)
Blocked on: Nothing

## File ownership (for parallel work)
<!-- Prevent merge conflicts by assigning file ownership to agents -->
<!-- Example: "Agent 1 owns src/game/*, Agent 2 owns src/engine/*" -->
