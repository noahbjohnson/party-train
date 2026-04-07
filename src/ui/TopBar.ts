export class TopBar {
  private container: HTMLElement;
  private roundEl: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = 'top-bar';

    this.roundEl = document.createElement('div');
    this.roundEl.className = 'round-indicator';
    this.container.appendChild(this.roundEl);
  }

  updateRound(roundIndex: number, hubValue: number): void {
    this.roundEl.textContent = `Round ${roundIndex + 1} of 13 \u2014 Hub: ${hubValue}`;
  }
}
