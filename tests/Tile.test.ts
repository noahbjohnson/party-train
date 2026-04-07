import { describe, it, expect } from 'vitest';
import { createTile, tileMatchesValue, getConnectingSide, getOtherSide, tileToString } from '../src/game/Tile.js';

describe('Tile', () => {
  it('should create a tile with correct properties', () => {
    const tile = createTile(0, 3, 7);
    expect(tile.id).toBe(0);
    expect(tile.sideA).toBe(3);
    expect(tile.sideB).toBe(7);
    expect(tile.isDouble).toBe(false);
    expect(tile.pipCount).toBe(10);
  });

  it('should normalize sides so sideA <= sideB', () => {
    const tile = createTile(1, 9, 2);
    expect(tile.sideA).toBe(2);
    expect(tile.sideB).toBe(9);
  });

  it('should detect doubles', () => {
    const tile = createTile(2, 5, 5);
    expect(tile.isDouble).toBe(true);
    expect(tile.pipCount).toBe(10);
  });

  it('should match values on either side', () => {
    const tile = createTile(0, 3, 7);
    expect(tileMatchesValue(tile, 3)).toBe(true);
    expect(tileMatchesValue(tile, 7)).toBe(true);
    expect(tileMatchesValue(tile, 5)).toBe(false);
  });

  it('should determine connecting side', () => {
    const tile = createTile(0, 3, 7);
    expect(getConnectingSide(tile, 3)).toBe('normal');
    expect(getConnectingSide(tile, 7)).toBe('flipped');
    expect(getConnectingSide(tile, 5)).toBe(null);
  });

  it('should get other side based on orientation', () => {
    const tile = createTile(0, 3, 7);
    expect(getOtherSide(tile, 'normal')).toBe(7);
    expect(getOtherSide(tile, 'flipped')).toBe(3);
  });

  it('should format tile as string', () => {
    const tile = createTile(0, 3, 7);
    expect(tileToString(tile)).toBe('[3|7]');
  });
});
