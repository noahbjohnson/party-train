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

    // Top row: Bone Pile count + Best Train light side by side
    const topRow = document.createElement('div');
    topRow.className = 'info-top-row';

    const boneGroup = document.createElement('div');
    boneGroup.className = 'info-group';
    const boneLabel = document.createElement('div');
    boneLabel.className = 'info-label';
    boneLabel.textContent = 'Bone Pile';
    boneGroup.appendChild(boneLabel);
    this.bonePileEl = document.createElement('div');
    this.bonePileEl.className = 'info-value bone-pile-count';
    this.bonePileEl.textContent = '0';
    boneGroup.appendChild(this.bonePileEl);
    topRow.appendChild(boneGroup);

    const bestGroup = document.createElement('div');
    bestGroup.className = 'info-group';
    const bestLabel = document.createElement('div');
    bestLabel.className = 'info-label';
    bestLabel.textContent = 'Best Train';
    bestGroup.appendChild(bestLabel);
    this.bestTrainEl = document.createElement('div');
    this.bestTrainEl.className = 'info-value best-train-light';
    bestGroup.appendChild(this.bestTrainEl);
    topRow.appendChild(bestGroup);

    this.container.appendChild(topRow);

    // Bottom: Start Double tile
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

    const fullSet = generateFullSet();
    const doubleTile = fullSet.find(t => t.isDouble && t.sideA === hubValue);
    if (!doubleTile) return;

    const scale = 0.45;
    const w = Math.floor(this.atlas.tileWidth * scale);
    const h = Math.floor(this.atlas.tileHeight * scale);

    const wrapper = document.createElement('div');
    wrapper.style.width = `${h}px`;
    wrapper.style.height = `${w}px`;
    wrapper.style.position = 'relative';

    const tileEl = document.createElement('div');
    tileEl.style.width = `${w}px`;
    tileEl.style.height = `${h}px`;
    tileEl.style.backgroundImage = `url(${this.atlas.canvas.toDataURL()})`;
    tileEl.style.backgroundSize = `${this.atlas.cols * w}px auto`;
    tileEl.style.borderRadius = '3px';
    tileEl.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
    tileEl.style.transform = 'rotate(90deg)';
    tileEl.style.position = 'absolute';
    tileEl.style.left = `${(h - w) / 2}px`;
    tileEl.style.top = `${(w - h) / 2}px`;

    const col = doubleTile.id % this.atlas.cols;
    const row = Math.floor(doubleTile.id / this.atlas.cols);
    tileEl.style.backgroundPosition = `-${col * w}px -${row * h}px`;

    wrapper.appendChild(tileEl);
    this.startDoubleEl.appendChild(wrapper);
  }

  updateBestTrain(status: 'green' | 'yellow' | 'red'): void {
    this.bestTrainEl.textContent = '';
    const colors = { green: '#22C55E', yellow: '#EAB308', red: '#EF4444' };
    const light = document.createElement('span');
    light.className = 'traffic-light';
    light.style.backgroundColor = colors[status];
    light.style.display = 'inline-block';
    light.style.width = '18px';
    light.style.height = '18px';
    light.style.borderRadius = '50%';
    this.bestTrainEl.appendChild(light);
  }
}
