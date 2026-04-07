import { Player } from '../types.js';
import { EventBus } from '../utils/EventBus.js';

export class ScoreOverlay {
  private overlay: HTMLElement;
  private eventBus: EventBus;

  constructor(container: HTMLElement, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.overlay = document.createElement('div');
    this.overlay.className = 'score-overlay';
    this.overlay.style.display = 'none';
    container.appendChild(this.overlay);
  }

  showRoundEnd(players: Player[], roundIndex: number): void {
    this.overlay.textContent = '';
    this.overlay.style.display = 'flex';

    const panel = document.createElement('div');
    panel.className = 'score-panel';

    const title = document.createElement('h2');
    title.textContent = `Round ${roundIndex + 1} Complete`;
    panel.appendChild(title);

    const table = document.createElement('table');
    table.className = 'score-table';

    const header = document.createElement('tr');
    for (const text of ['Player', 'Round', 'Total']) {
      const th = document.createElement('th');
      th.textContent = text;
      header.appendChild(th);
    }
    table.appendChild(header);

    for (const p of players) {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      nameCell.textContent = p.name;
      row.appendChild(nameCell);

      const roundCell = document.createElement('td');
      roundCell.textContent = String(p.roundScore);
      row.appendChild(roundCell);

      const totalCell = document.createElement('td');
      totalCell.textContent = String(p.score);
      row.appendChild(totalCell);

      table.appendChild(row);
    }
    panel.appendChild(table);

    const btn = document.createElement('button');
    btn.className = 'score-btn';
    btn.textContent = 'Next Round';
    btn.addEventListener('click', () => {
      this.hide();
      this.eventBus.emit('ui:nextRound', {});
    });
    panel.appendChild(btn);

    this.overlay.appendChild(panel);
  }

  showGameOver(players: Player[], winnerId: number): void {
    this.overlay.textContent = '';
    this.overlay.style.display = 'flex';

    const panel = document.createElement('div');
    panel.className = 'score-panel';

    const title = document.createElement('h2');
    title.textContent = 'Game Over!';
    panel.appendChild(title);

    const winner = players.find(p => p.id === winnerId);
    const winnerEl = document.createElement('div');
    winnerEl.className = 'winner-announce';
    winnerEl.textContent = `${winner?.name ?? 'Unknown'} wins with ${winner?.score ?? 0} points!`;
    panel.appendChild(winnerEl);

    const table = document.createElement('table');
    table.className = 'score-table';

    const header = document.createElement('tr');
    for (const text of ['Place', 'Player', 'Score']) {
      const th = document.createElement('th');
      th.textContent = text;
      header.appendChild(th);
    }
    table.appendChild(header);

    const sorted = [...players].sort((a, b) => a.score - b.score);
    sorted.forEach((p, i) => {
      const row = document.createElement('tr');
      if (p.id === winnerId) row.classList.add('winner-row');

      const placeCell = document.createElement('td');
      placeCell.textContent = `#${i + 1}`;
      row.appendChild(placeCell);

      const nameCell = document.createElement('td');
      nameCell.textContent = p.name;
      row.appendChild(nameCell);

      const scoreCell = document.createElement('td');
      scoreCell.textContent = String(p.score);
      row.appendChild(scoreCell);

      table.appendChild(row);
    });
    panel.appendChild(table);

    const btn = document.createElement('button');
    btn.className = 'score-btn';
    btn.textContent = 'Play Again';
    btn.addEventListener('click', () => {
      this.hide();
      this.eventBus.emit('ui:restartGame', {});
    });
    panel.appendChild(btn);

    this.overlay.appendChild(panel);
  }

  hide(): void {
    this.overlay.style.display = 'none';
  }
}
