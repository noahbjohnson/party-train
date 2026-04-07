import { Player } from '../types.js';

export class TopBar {
  private container: HTMLElement;
  private roundEl: HTMLElement;
  private scoresEl: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = 'top-bar';

    this.roundEl = document.createElement('div');
    this.roundEl.className = 'round-indicator';
    this.container.appendChild(this.roundEl);

    this.scoresEl = document.createElement('div');
    this.scoresEl.className = 'score-summary';
    this.container.appendChild(this.scoresEl);
  }

  updateRound(roundIndex: number, hubValue: number): void {
    this.roundEl.textContent = `Round ${roundIndex + 1} of 13 \u2014 Hub: ${hubValue}`;
  }

  updateScores(players: Player[]): void {
    this.scoresEl.textContent = '';
    for (const p of players) {
      const span = document.createElement('span');
      span.className = 'score-item';
      span.textContent = `${p.name}: ${p.score}`;
      this.scoresEl.appendChild(span);
    }
  }
}
