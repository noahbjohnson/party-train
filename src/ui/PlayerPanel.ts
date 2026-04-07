import { Player, Train } from '../types.js';
import { PLAYER_COLORS } from '../utils/Constants.js';

export class PlayerPanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = 'player-panel';
  }

  render(players: Player[], trains: Map<string, Train>, currentPlayerIndex: number): void {
    this.container.textContent = '';

    for (const player of players) {
      const row = document.createElement('div');
      row.className = 'panel-player-row';
      if (player.id === currentPlayerIndex) {
        row.classList.add('panel-active');
      }

      const color = PLAYER_COLORS[player.id] ?? '#888';
      const train = trains.get(player.trainId);

      const badge = document.createElement('div');
      badge.className = 'panel-badge';
      badge.style.backgroundColor = color;
      badge.textContent = player.name;
      row.appendChild(badge);

      const info = document.createElement('div');
      info.className = 'panel-info';

      const scoreEl = document.createElement('span');
      scoreEl.className = 'panel-score';
      scoreEl.textContent = `Score: ${player.score}`;
      info.appendChild(scoreEl);

      if (!player.isHuman) {
        const countEl = document.createElement('span');
        countEl.className = 'panel-tile-count';
        countEl.textContent = `${player.hand.length} tiles`;
        info.appendChild(countEl);
      }

      if (train?.isOpen) {
        const openEl = document.createElement('span');
        openEl.className = 'panel-open-marker';
        openEl.textContent = 'OPEN';
        info.appendChild(openEl);
      }

      row.appendChild(info);
      this.container.appendChild(row);
    }
  }
}
