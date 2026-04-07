import { Tile } from '../types.js';
import { TileRenderer } from './TileRenderer.js';
import { GridLayout, HandLayout } from './GridLayout.js';

export class HandRenderer {
  private layout: GridLayout;
  private tileRenderer: TileRenderer;
  private handTileIds: number[] = [];

  constructor(layout: GridLayout, tileRenderer: TileRenderer) {
    this.layout = layout;
    this.tileRenderer = tileRenderer;
  }

  renderHand(hand: Tile[], handLayout: HandLayout): void {
    // Clear old hand tiles that are no longer in hand
    for (const oldId of this.handTileIds) {
      if (!hand.some(t => t.id === oldId)) {
        this.tileRenderer.removeTile(oldId);
      }
    }

    this.handTileIds = hand.map(t => t.id);

    for (let i = 0; i < hand.length; i++) {
      const tile = hand[i]!;
      const pos = this.layout.getHandTilePosition(handLayout, i);

      // Create if needed
      let el = this.tileRenderer.getElement(tile.id);
      if (!el) {
        this.tileRenderer.createTileElement(tile, true);
      }

      this.tileRenderer.setSize(tile.id, handLayout.tileWidth, handLayout.tileHeight);
      this.tileRenderer.setPosition(tile.id, pos.x, pos.y);
      this.tileRenderer.setRotation(tile.id, 0);
    }
  }

  highlightPlayable(playableTileIds: Set<number>): void {
    for (const tileId of this.handTileIds) {
      this.tileRenderer.highlight(tileId, playableTileIds.has(tileId));
    }
  }

  clearHighlights(): void {
    for (const tileId of this.handTileIds) {
      this.tileRenderer.highlight(tileId, false);
    }
  }
}
