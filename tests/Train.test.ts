import { describe, it, expect } from 'vitest';
import { createTrain, canPlayOnTrain, playTileOnTrain, setTrainOpen, satisfyDouble } from '../src/game/Train.js';
import { createTile } from '../src/game/Tile.js';

describe('Train', () => {
  it('should create a train with correct initial state', () => {
    const train = createTrain('player-0', 0, 12);
    expect(train.id).toBe('player-0');
    expect(train.ownerId).toBe(0);
    expect(train.openEnd).toBe(12);
    expect(train.isOpen).toBe(false);
    expect(train.tiles).toHaveLength(0);
    expect(train.hasUnsatisfiedDouble).toBe(false);
  });

  it('should create Party Train as always open', () => {
    const train = createTrain('party', null, 12);
    expect(train.ownerId).toBeNull();
    expect(train.isOpen).toBe(true);
  });

  it('should check if a tile can be played', () => {
    const train = createTrain('player-0', 0, 12);
    const matchingTile = createTile(0, 7, 12);
    const nonMatchingTile = createTile(1, 3, 5);
    expect(canPlayOnTrain(train, matchingTile)).toBe(true);
    expect(canPlayOnTrain(train, nonMatchingTile)).toBe(false);
  });

  it('should play a tile and update open end', () => {
    const train = createTrain('player-0', 0, 12);
    const tile = createTile(0, 7, 12);
    const updated = playTileOnTrain(train, tile);
    expect(updated.tiles).toHaveLength(1);
    expect(updated.openEnd).toBe(7); // 12 connected, 7 is now open
    expect(updated.hasUnsatisfiedDouble).toBe(false);
  });

  it('should handle flipped orientation', () => {
    const train = createTrain('player-0', 0, 7);
    const tile = createTile(0, 3, 7); // sideA=3, sideB=7, connecting on sideB
    const updated = playTileOnTrain(train, tile);
    expect(updated.openEnd).toBe(3);
    expect(updated.tiles[0]!.orientation).toBe('flipped');
  });

  it('should detect unsatisfied double when double is played', () => {
    const train = createTrain('player-0', 0, 5);
    const doubleTile = createTile(0, 5, 5);
    const updated = playTileOnTrain(train, doubleTile);
    expect(updated.hasUnsatisfiedDouble).toBe(true);
    expect(updated.openEnd).toBe(5);
  });

  it('should toggle open marker', () => {
    const train = createTrain('player-0', 0, 12);
    expect(train.isOpen).toBe(false);
    const opened = setTrainOpen(train, true);
    expect(opened.isOpen).toBe(true);
    const closed = setTrainOpen(opened, false);
    expect(closed.isOpen).toBe(false);
  });

  it('should satisfy a double', () => {
    const train = createTrain('player-0', 0, 5);
    const doubleTile = createTile(0, 5, 5);
    const withDouble = playTileOnTrain(train, doubleTile);
    expect(withDouble.hasUnsatisfiedDouble).toBe(true);
    const satisfied = satisfyDouble(withDouble);
    expect(satisfied.hasUnsatisfiedDouble).toBe(false);
  });

  it('should throw when tile does not match', () => {
    const train = createTrain('player-0', 0, 12);
    const badTile = createTile(0, 3, 5);
    expect(() => playTileOnTrain(train, badTile)).toThrow();
  });
});
