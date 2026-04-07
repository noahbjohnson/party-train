import { Player, Train } from '../types.js';
import { PLAYER_COLORS } from '../utils/Constants.js';

export class PlayerInfoRenderer {
  private container: HTMLElement;
  private elements: Map<number, HTMLElement> = new Map();

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = 'player-info-panel';
  }

  render(players: Player[], trains: Map<string, Train>, currentPlayerIndex: number): void {
    this.container.textContent = '';
    this.elements.clear();

    for (const player of players) {
      const row = document.createElement('div');
      row.className = 'player-info-row';
      if (player.id === currentPlayerIndex) {
        row.classList.add('active');
      }

      const color = PLAYER_COLORS[player.id] ?? '#888';
      const train = trains.get(player.trainId);
      const isOpen = train?.isOpen ?? false;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.style.background = color;
      nameSpan.textContent = player.name;
      row.appendChild(nameSpan);

      const countSpan = document.createElement('span');
      countSpan.className = 'tile-count';
      countSpan.textContent = player.isHuman ? '' : `${player.hand.length} tiles`;
      row.appendChild(countSpan);

      if (isOpen) {
        const marker = document.createElement('span');
        marker.className = 'open-marker';
        marker.title = 'Train is open';
        marker.textContent = '\u{1F682}';
        row.appendChild(marker);
      }

      this.container.appendChild(row);
      this.elements.set(player.id, row);
    }

    // Party train row
    const partyRow = document.createElement('div');
    partyRow.className = 'player-info-row party-train-row';
    const partyTrain = trains.get('party');

    const partyName = document.createElement('span');
    partyName.className = 'player-name';
    partyName.style.background = '#666';
    partyName.textContent = 'Party Train';
    partyRow.appendChild(partyName);

    const partyCount = document.createElement('span');
    partyCount.className = 'tile-count';
    partyCount.textContent = `${partyTrain?.tiles.length ?? 0} played`;
    partyRow.appendChild(partyCount);

    this.container.appendChild(partyRow);
  }

  highlightActive(playerId: number): void {
    for (const [id, el] of this.elements) {
      el.classList.toggle('active', id === playerId);
    }
  }
}
