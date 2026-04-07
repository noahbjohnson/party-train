import { AtlasInfo } from '../engine/TileAtlas.js';
import { generateFullSet } from '../game/TileSet.js';

export class InfoPanel {
  private container: HTMLElement;
  private bonePileEl: HTMLElement;
  private startDoubleEl: HTMLElement;
  private bestTrainEl: HTMLElement;
  private atlas: AtlasInfo | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = 'info-panel';

    const boneSection = document.createElement('div');
    boneSection.className = 'info-section';
    const boneLabel = document.createElement('div');
    boneLabel.className = 'info-label';
    boneLabel.textContent = 'Bone Pile';
    boneSection.appendChild(boneLabel);
    this.bonePileEl = document.createElement('div');
    this.bonePileEl.className = 'info-value bone-pile-count';
    this.bonePileEl.textContent = '0';
    boneSection.appendChild(this.bonePileEl);
    this.container.appendChild(boneSection);

    const doubleSection = document.createElement('div');
    doubleSection.className = 'info-section';
    const doubleLabel = document.createElement('div');
    doubleLabel.className = 'info-label';
    doubleLabel.textContent = 'Start Double';
    doubleSection.appendChild(doubleLabel);
    this.startDoubleEl = document.createElement('div');
    this.startDoubleEl.className = 'info-value start-double';
    doubleSection.appendChild(this.startDoubleEl);
    this.container.appendChild(doubleSection);

    const bestSection = document.createElement('div');
    bestSection.className = 'info-section';
    const bestLabel = document.createElement('div');
    bestLabel.className = 'info-label';
    bestLabel.textContent = 'Best Train';
    bestSection.appendChild(bestLabel);
    this.bestTrainEl = document.createElement('div');
    this.bestTrainEl.className = 'info-value best-train-light';
    bestSection.appendChild(this.bestTrainEl);
    this.container.appendChild(bestSection);
  }

  setAtlas(atlas: AtlasInfo): void {
    this.atlas = atlas;
  }

  updateBonePile(count: number): void {
    this.bonePileEl.textContent = String(count);
  }

  updateStartDouble(hubValue: number): void {
    this.startDoubleEl.textContent = '';

    if (!this.atlas) {
      this.startDoubleEl.textContent = `[${hubValue}|${hubValue}]`;
      return;
    }

    // Find the double tile's ID in the full set
    const fullSet = generateFullSet();
    const doubleTile = fullSet.find(t => t.isDouble && t.sideA === hubValue);
    if (!doubleTile) return;

    const tileEl = document.createElement('div');
    const scale = 0.55;
    const w = Math.floor(this.atlas.tileWidth * scale);
    const h = Math.floor(this.atlas.tileHeight * scale);
    tileEl.style.width = `${w}px`;
    tileEl.style.height = `${h}px`;
    tileEl.style.backgroundImage = `url(${this.atlas.canvas.toDataURL()})`;
    tileEl.style.backgroundSize = `${this.atlas.cols * w}px auto`;
    tileEl.style.borderRadius = '3px';
    tileEl.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';

    const col = doubleTile.id % this.atlas.cols;
    const row = Math.floor(doubleTile.id / this.atlas.cols);
    tileEl.style.backgroundPosition = `-${col * w}px -${row * h}px`;

    this.startDoubleEl.appendChild(tileEl);
  }

  updateBestTrain(status: 'green' | 'yellow' | 'red'): void {
    this.bestTrainEl.textContent = '';
    const colors = { green: '#22C55E', yellow: '#EAB308', red: '#EF4444' };
    const light = document.createElement('span');
    light.className = 'traffic-light';
    light.style.backgroundColor = colors[status];
    light.style.display = 'inline-block';
    light.style.width = '20px';
    light.style.height = '20px';
    light.style.borderRadius = '50%';
    this.bestTrainEl.appendChild(light);
  }
}
