import { Player, Train } from '../types.js';
import { PLAYER_COLORS } from '../utils/Constants.js';

export class PlayerPanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = 'player-panel';
  }

  /**
   * Render player info rows aligned to train rows.
   * Order: AI players, Party Train, then human player — matching train row order.
   */
  render(players: Player[], trains: Map<string, Train>, currentPlayerIndex: number): void {
    this.container.textContent = '';

    // Sort: AI players first, then party train slot, then human
    const human = players.find(p => p.isHuman);
    const aiPlayers = players.filter(p => !p.isHuman);

    const rows: Array<{ player?: Player; isParty?: boolean }> = [
      ...aiPlayers.map(p => ({ player: p })),
      { isParty: true },
      ...(human ? [{ player: human }] : []),
    ];

    for (const entry of rows) {
      const row = document.createElement('div');
      row.className = 'panel-row';

      if (entry.isParty) {
        row.classList.add('panel-row-party');
        const label = document.createElement('span');
        label.className = 'panel-name panel-name-party';
        label.textContent = 'Party Train';
        row.appendChild(label);

        const partyTrain = trains.get('party');
        if (partyTrain && partyTrain.tiles.length > 0) {
          const count = document.createElement('span');
          count.className = 'panel-detail';
          count.textContent = `${partyTrain.tiles.length} played`;
          row.appendChild(count);
        }
      } else if (entry.player) {
        const p = entry.player;
        const color = PLAYER_COLORS[p.id] ?? '#888';
        const train = trains.get(p.trainId);
        const isActive = p.id === currentPlayerIndex;

        if (isActive) row.classList.add('panel-row-active');

        const name = document.createElement('span');
        name.className = 'panel-name';
        name.style.backgroundColor = color;
        name.textContent = p.name;
        row.appendChild(name);

        const score = document.createElement('span');
        score.className = 'panel-detail';
        score.textContent = String(p.score);
        row.appendChild(score);

        if (!p.isHuman) {
          const tiles = document.createElement('span');
          tiles.className = 'panel-detail panel-tiles';
          tiles.textContent = `${p.hand.length}`;
          row.appendChild(tiles);
        }

        if (train?.isOpen) {
          const marker = document.createElement('span');
          marker.className = 'panel-open';
          marker.textContent = 'OPEN';
          row.appendChild(marker);
        }
      }

      this.container.appendChild(row);
    }
  }
}
