import { Tile } from '../types.js';
import { AtlasInfo } from './TileAtlas.js';

export interface RenderedTile {
  tileId: number;
  element: HTMLDivElement;
  isFaceUp: boolean;
}

export class TileRenderer {
  private atlas: AtlasInfo;
  private tiles: Map<number, RenderedTile> = new Map();
  private container: HTMLElement;

  constructor(atlas: AtlasInfo, container: HTMLElement) {
    this.atlas = atlas;
    this.container = container;
  }

  createTileElement(tile: Tile, faceUp: boolean): RenderedTile {
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset['tileId'] = String(tile.id);
    el.style.width = `${this.atlas.tileWidth}px`;
    el.style.height = `${this.atlas.tileHeight}px`;
    el.style.position = 'absolute';
    el.style.backgroundImage = `url(${this.atlas.canvas.toDataURL()})`;
    el.style.backgroundSize = `${this.atlas.cols * this.atlas.tileWidth}px auto`;
    el.style.imageRendering = 'pixelated';
    el.style.transition = 'transform 0.3s ease-out, left 0.3s ease-out, top 0.3s ease-out';
    el.style.cursor = 'pointer';
    el.style.zIndex = '10';

    this.setFace(el, faceUp ? tile.id : this.atlas.backIndex);

    const rendered: RenderedTile = { tileId: tile.id, element: el, isFaceUp: faceUp };
    this.tiles.set(tile.id, rendered);
    this.container.appendChild(el);

    return rendered;
  }

  setPosition(tileId: number, x: number, y: number): void {
    const rendered = this.tiles.get(tileId);
    if (!rendered) return;
    rendered.element.style.left = `${x}px`;
    rendered.element.style.top = `${y}px`;
  }

  setRotation(tileId: number, degrees: number): void {
    const rendered = this.tiles.get(tileId);
    if (!rendered) return;
    rendered.element.style.transform = `rotate(${degrees}deg)`;
  }

  flipTile(tileId: number, faceUp: boolean): void {
    const rendered = this.tiles.get(tileId);
    if (!rendered) return;
    rendered.isFaceUp = faceUp;
    this.setFace(rendered.element, faceUp ? tileId : this.atlas.backIndex);
  }

  highlight(tileId: number, highlighted: boolean): void {
    const rendered = this.tiles.get(tileId);
    if (!rendered) return;
    rendered.element.style.boxShadow = highlighted ? '0 0 8px 2px #FFD700' : 'none';
    rendered.element.style.zIndex = highlighted ? '20' : '10';
  }

  removeTile(tileId: number): void {
    const rendered = this.tiles.get(tileId);
    if (rendered) {
      rendered.element.remove();
      this.tiles.delete(tileId);
    }
  }

  clearAll(): void {
    for (const rendered of this.tiles.values()) {
      rendered.element.remove();
    }
    this.tiles.clear();
  }

  getElement(tileId: number): HTMLDivElement | undefined {
    return this.tiles.get(tileId)?.element;
  }

  private setFace(el: HTMLDivElement, index: number): void {
    const col = index % this.atlas.cols;
    const row = Math.floor(index / this.atlas.cols);
    el.style.backgroundPosition = `-${col * this.atlas.tileWidth}px -${row * this.atlas.tileHeight}px`;
  }
}
