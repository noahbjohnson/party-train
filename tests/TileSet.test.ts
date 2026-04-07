import { describe, it, expect } from 'vitest';
import { generateFullSet, shuffleTiles, findDouble, removeTile } from '../src/game/TileSet.js';

describe('TileSet', () => {
  it('should generate exactly 91 tiles', () => {
    const tiles = generateFullSet();
    expect(tiles).toHaveLength(91);
  });

  it('should have all unique tile IDs', () => {
    const tiles = generateFullSet();
    const ids = new Set(tiles.map(t => t.id));
    expect(ids.size).toBe(91);
  });

  it('should have all unique tile combinations', () => {
    const tiles = generateFullSet();
    const combos = new Set(tiles.map(t => `${t.sideA}-${t.sideB}`));
    expect(combos.size).toBe(91);
  });

  it('should have correct total pip count of 1092', () => {
    const tiles = generateFullSet();
    const totalPips = tiles.reduce((sum, t) => sum + t.pipCount, 0);
    expect(totalPips).toBe(1092);
  });

  it('should have 13 doubles', () => {
    const tiles = generateFullSet();
    const doubles = tiles.filter(t => t.isDouble);
    expect(doubles).toHaveLength(13);
  });

  it('should always have sideA <= sideB', () => {
    const tiles = generateFullSet();
    for (const tile of tiles) {
      expect(tile.sideA).toBeLessThanOrEqual(tile.sideB);
    }
  });

  it('should shuffle tiles into a different order', () => {
    const tiles = generateFullSet();
    const shuffled = shuffleTiles(tiles);
    expect(shuffled).toHaveLength(91);
    // Check all tiles are present
    const ids = new Set(shuffled.map(t => t.id));
    expect(ids.size).toBe(91);
  });

  it('should find doubles by value', () => {
    const tiles = generateFullSet();
    const double12 = findDouble(tiles, 12);
    expect(double12).toBeDefined();
    expect(double12!.sideA).toBe(12);
    expect(double12!.sideB).toBe(12);
  });

  it('should remove a tile by ID', () => {
    const tiles = generateFullSet();
    const removed = removeTile(tiles, 0);
    expect(removed).toHaveLength(90);
    expect(removed.find(t => t.id === 0)).toBeUndefined();
  });
});
