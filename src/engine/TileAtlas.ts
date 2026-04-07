import { Tile, MAX_PIP } from '../types.js';
import { PIP_COLORS } from '../utils/Constants.js';
import { generateFullSet } from '../game/TileSet.js';

const TILE_W = 60;
const TILE_H = 120;
const HALF_H = TILE_H / 2;
const PIP_RADIUS = 4;
const COLS = 14;

// Standard pip layout positions within a half-tile (normalized 0-1)
const PIP_POSITIONS: Record<number, Array<[number, number]>> = {
  0: [],
  1: [[0.5, 0.5]],
  2: [[0.72, 0.28], [0.28, 0.72]],
  3: [[0.72, 0.28], [0.5, 0.5], [0.28, 0.72]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
  6: [[0.28, 0.2], [0.28, 0.5], [0.28, 0.8], [0.72, 0.2], [0.72, 0.5], [0.72, 0.8]],
  7: [[0.28, 0.2], [0.28, 0.5], [0.28, 0.8], [0.5, 0.5], [0.72, 0.2], [0.72, 0.5], [0.72, 0.8]],
  8: [[0.28, 0.2], [0.28, 0.5], [0.28, 0.8], [0.5, 0.35], [0.5, 0.65], [0.72, 0.2], [0.72, 0.5], [0.72, 0.8]],
  9: [[0.25, 0.2], [0.25, 0.5], [0.25, 0.8], [0.5, 0.2], [0.5, 0.5], [0.5, 0.8], [0.75, 0.2], [0.75, 0.5], [0.75, 0.8]],
  10: [[0.25, 0.15], [0.25, 0.45], [0.25, 0.75], [0.5, 0.2], [0.5, 0.4], [0.5, 0.6], [0.5, 0.8], [0.75, 0.15], [0.75, 0.45], [0.75, 0.75]],
  11: [[0.25, 0.15], [0.25, 0.4], [0.25, 0.65], [0.25, 0.9], [0.5, 0.2], [0.5, 0.5], [0.5, 0.8], [0.75, 0.15], [0.75, 0.4], [0.75, 0.65], [0.75, 0.9]],
  12: [[0.25, 0.15], [0.25, 0.38], [0.25, 0.62], [0.25, 0.85], [0.5, 0.15], [0.5, 0.38], [0.5, 0.62], [0.5, 0.85], [0.75, 0.15], [0.75, 0.38], [0.75, 0.62], [0.75, 0.85]],
};

export interface AtlasInfo {
  canvas: HTMLCanvasElement;
  tileWidth: number;
  tileHeight: number;
  cols: number;
  backIndex: number; // index of the tile-back sprite in the atlas
}

export function generateTileAtlas(): AtlasInfo {
  const tiles = generateFullSet();
  const totalSlots = tiles.length + 1; // +1 for tile back
  const rows = Math.ceil(totalSlots / COLS);

  const canvas = document.createElement('canvas');
  canvas.width = COLS * TILE_W;
  canvas.height = rows * TILE_H;

  const ctx = canvas.getContext('2d')!;

  // Draw each tile face
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i]!;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * TILE_W;
    const y = row * TILE_H;
    drawTileFace(ctx, x, y, tile);
  }

  // Draw tile back
  const backIndex = tiles.length;
  const backCol = backIndex % COLS;
  const backRow = Math.floor(backIndex / COLS);
  drawTileBack(ctx, backCol * TILE_W, backRow * TILE_H);

  return { canvas, tileWidth: TILE_W, tileHeight: TILE_H, cols: COLS, backIndex };
}

function drawTileFace(ctx: CanvasRenderingContext2D, x: number, y: number, tile: Tile): void {
  const pad = 2;

  // Background
  ctx.fillStyle = '#FFFFF0'; // ivory
  roundRect(ctx, x + pad, y + pad, TILE_W - pad * 2, TILE_H - pad * 2, 4);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + pad, y + pad, TILE_W - pad * 2, TILE_H - pad * 2, 4);
  ctx.stroke();

  // Divider line
  ctx.beginPath();
  ctx.moveTo(x + pad + 4, y + HALF_H);
  ctx.lineTo(x + TILE_W - pad - 4, y + HALF_H);
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw pips for sideA (top half)
  drawPips(ctx, x + pad, y + pad, TILE_W - pad * 2, HALF_H - pad, tile.sideA);

  // Draw pips for sideB (bottom half)
  drawPips(ctx, x + pad, y + HALF_H, TILE_W - pad * 2, HALF_H - pad, tile.sideB);
}

function drawPips(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number): void {
  const positions = PIP_POSITIONS[value];
  if (!positions) return;

  const color = PIP_COLORS[value] ?? '#000';

  for (const [px, py] of positions) {
    ctx.beginPath();
    ctx.arc(x + px * w, y + py * h, PIP_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawTileBack(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const pad = 2;
  ctx.fillStyle = '#1a365d'; // navy
  roundRect(ctx, x + pad, y + pad, TILE_W - pad * 2, TILE_H - pad * 2, 4);
  ctx.fill();

  ctx.strokeStyle = '#2d4a7a';
  ctx.lineWidth = 1;
  roundRect(ctx, x + pad, y + pad, TILE_W - pad * 2, TILE_H - pad * 2, 4);
  ctx.stroke();

  // Subtle diamond pattern
  ctx.strokeStyle = '#2d4a7a';
  ctx.lineWidth = 0.5;
  const cx = x + TILE_W / 2;
  const cy = y + TILE_H / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 20);
  ctx.lineTo(cx + 12, cy);
  ctx.lineTo(cx, cy + 20);
  ctx.lineTo(cx - 12, cy);
  ctx.closePath();
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function getTileAtlasPosition(tileId: number): { u: number; v: number; col: number; row: number } {
  const col = tileId % COLS;
  const row = Math.floor(tileId / COLS);
  return { u: col / COLS, v: row / Math.ceil(92 / COLS), col, row };
}
