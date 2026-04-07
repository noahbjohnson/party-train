# Party Train Dominoes

## Project overview
Single-player Party Train (Mexican Train variant) dominoes game.
PlayCanvas engine (code-first, no editor), TypeScript, Vite, Vitest.
Player vs 1-3 AI opponents. Clean 2D top-down aesthetic with horizontal train rows.

## Architecture
- `src/game/` — Pure game logic. No engine imports. Testable standalone.
- `src/engine/` — DOM-based rendering layer (tile atlas sprites, absolute positioning). Communicates with game via EventBus.
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
- Use DOM methods (createElement/textContent) instead of innerHTML — security hook blocks innerHTML

## Rendering gotchas
- Tile atlas source dimensions: 60x120 (TILE_W x TILE_H in TileAtlas.ts) — all layout math must reference these
- Tiles are absolutely positioned within their container — positions must be relative to container, not page
- Train tiles are CSS-rotated 90° for landscape — rotate() doesn't change DOM box, so position offsets are needed (see TrainRowRenderer)
- Doubles stay upright (0° rotation) on trains; normal tiles rotate ±90° based on orientation

## Game rules quick reference
- See `party-train-plan.md` Section 1 for complete rules
- Turn sequence: check unsatisfied double -> normal play -> can't play -> draw -> mark train
- Doubles grant bonus play; unsatisfied doubles must be covered by next player(s)
- Party Train is always open to all players
- Lowest total score across 13 rounds wins

## Current status
Phase: 5 complete, layout polish done
Last completed: Fixed train tile layout — sideways tiles with proper rotation offset compensation, scaled sizing, relative positioning
Next up: Phase 6 — Polish (sound integration in game loop, mobile touch refinement, save/load, help overlay, animation refinement, deploy to Cloudflare Pages)
Blocked on: Nothing
Tests: 58 passing, typecheck clean, production build ~34KB JS + 5KB CSS

## File ownership (for parallel work)
<!-- Prevent merge conflicts by assigning file ownership to agents -->
<!-- Example: "Agent 1 owns src/game/*, Agent 2 owns src/engine/*" -->
