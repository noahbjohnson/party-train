import { Tile } from '../types.js';
import { TileRenderer } from './TileRenderer.js';
import { GridLayout, HandLayout } from './GridLayout.js';

export class HandRenderer {
  private layout: GridLayout;
  private tileRenderer: TileRenderer;
  private handTileIds: number[] = [];
  private container: HTMLElement;
  private onReorder: ((fromIndex: number, toIndex: number) => void) | null = null;
  private lastHandLayout: HandLayout | null = null;

  // Drag state
  private dragging = false;
  private dragTileId = -1;
  private dragFromIndex = -1;
  private dragStartX = 0;
  private dragClone: HTMLElement | null = null;
  private dropIndicator: HTMLElement | null = null;
  private currentDropIndex = -1;

  constructor(layout: GridLayout, tileRenderer: TileRenderer, container: HTMLElement) {
    this.layout = layout;
    this.tileRenderer = tileRenderer;
    this.container = container;
    this.setupDrag();
  }

  setReorderCallback(cb: (fromIndex: number, toIndex: number) => void): void {
    this.onReorder = cb;
  }

  renderHand(hand: Tile[], handLayout: HandLayout): void {
    this.lastHandLayout = handLayout;

    for (const oldId of this.handTileIds) {
      if (!hand.some(t => t.id === oldId)) {
        this.tileRenderer.removeTile(oldId);
      }
    }

    this.handTileIds = hand.map(t => t.id);

    for (let i = 0; i < hand.length; i++) {
      const tile = hand[i]!;
      const pos = this.layout.getHandTilePosition(handLayout, i);

      let el = this.tileRenderer.getElement(tile.id);
      if (!el) {
        this.tileRenderer.createTileElement(tile, true);
      }

      this.tileRenderer.setSize(tile.id, handLayout.tileWidth, handLayout.tileHeight);
      this.tileRenderer.setPosition(tile.id, pos.x, pos.y);
      this.tileRenderer.setRotation(tile.id, 90);
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

  private getVisualTileWidth(): number {
    // After rotation, visual width = DOM height
    if (!this.lastHandLayout) return 84;
    return this.lastHandLayout.tileHeight;
  }

  private getSlotIndexFromX(clientX: number): number {
    const rect = this.container.getBoundingClientRect();
    const relX = clientX - rect.left;
    const visualW = this.getVisualTileWidth();
    const padding = 4;
    const slotW = visualW + padding;
    // Use center-of-slot snapping: round to nearest slot center
    const idx = Math.round((relX - padding - visualW / 2) / slotW);
    return Math.max(0, Math.min(this.handTileIds.length - 1, idx));
  }

  private updateDropIndicator(clientX: number): void {
    if (!this.dropIndicator) return;

    const toIndex = this.getSlotIndexFromX(clientX);
    this.currentDropIndex = toIndex;

    // Find an existing tile element to get actual rendered vertical bounds
    const refTileId = this.handTileIds.find(id => id !== this.dragTileId);
    const refEl = refTileId !== undefined ? this.tileRenderer.getElement(refTileId) : undefined;

    if (refEl) {
      const containerRect = this.container.getBoundingClientRect();
      const tileRect = refEl.getBoundingClientRect();

      const visualW = this.getVisualTileWidth();
      const padding = 4;
      const slotW = visualW + padding;
      const indicatorX = padding + toIndex * slotW - 1;

      this.dropIndicator.style.left = `${indicatorX}px`;
      this.dropIndicator.style.top = `${tileRect.top - containerRect.top}px`;
      this.dropIndicator.style.height = `${tileRect.height}px`;
    }
  }

  private setupDrag(): void {
    this.container.addEventListener('mousedown', (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.tile') as HTMLElement | null;
      if (!target?.dataset['tileId']) return;

      const tileId = parseInt(target.dataset['tileId'], 10);
      const idx = this.handTileIds.indexOf(tileId);
      if (idx === -1) return;

      e.preventDefault();
      this.dragging = true;
      this.dragTileId = tileId;
      this.dragFromIndex = idx;
      this.dragStartX = e.clientX;

      // Create a visual clone that follows the mouse (not rotated, just a simple indicator)
      const clone = target.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = `${e.clientX - 40}px`;
      clone.style.top = `${e.clientY - 20}px`;
      clone.style.zIndex = '9999';
      clone.style.opacity = '0.7';
      clone.style.pointerEvents = 'none';
      clone.style.transform = 'rotate(90deg) scale(1.05)';
      clone.style.transition = 'none';
      document.body.appendChild(clone);
      this.dragClone = clone;

      // Dim the original
      target.style.opacity = '0.3';

      // Create drop indicator
      const indicator = document.createElement('div');
      indicator.className = 'drop-indicator';
      this.container.appendChild(indicator);
      this.dropIndicator = indicator;
      this.currentDropIndex = idx;
      this.updateDropIndicator(e.clientX);
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.dragging || !this.dragClone) return;
      this.dragClone.style.left = `${e.clientX - 40}px`;
      this.dragClone.style.top = `${e.clientY - 20}px`;
      this.updateDropIndicator(e.clientX);
    });

    document.addEventListener('mouseup', (e: MouseEvent) => {
      if (!this.dragging) return;

      // Restore original tile opacity
      const origEl = this.tileRenderer.getElement(this.dragTileId);
      if (origEl) origEl.style.opacity = '1';

      // Remove clone and indicator
      if (this.dragClone) {
        this.dragClone.remove();
        this.dragClone = null;
      }
      if (this.dropIndicator) {
        this.dropIndicator.remove();
        this.dropIndicator = null;
      }

      const toIndex = this.getSlotIndexFromX(e.clientX);
      if (toIndex !== this.dragFromIndex && this.onReorder) {
        this.onReorder(this.dragFromIndex, toIndex);
      }

      this.dragging = false;
      this.dragTileId = -1;
      this.dragFromIndex = -1;
      this.currentDropIndex = -1;
    });
  }
}
