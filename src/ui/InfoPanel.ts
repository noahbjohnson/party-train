export class InfoPanel {
  private container: HTMLElement;
  private bonePileEl: HTMLElement;
  private startDoubleEl: HTMLElement;
  private bestTrainEl: HTMLElement;

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

  updateBonePile(count: number): void {
    this.bonePileEl.textContent = String(count);
  }

  updateStartDouble(hubValue: number): void {
    this.startDoubleEl.textContent = `[${hubValue}|${hubValue}]`;
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
