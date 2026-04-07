import { EventBus } from '../utils/EventBus.js';
import { Difficulty } from '../types.js';

export class SetupScreen {
  private overlay: HTMLElement;
  private eventBus: EventBus;

  constructor(container: HTMLElement, eventBus: EventBus) {
    this.eventBus = eventBus;

    this.overlay = document.createElement('div');
    this.overlay.className = 'setup-overlay';

    const panel = document.createElement('div');
    panel.className = 'setup-panel';

    const title = document.createElement('h1');
    title.textContent = 'Party Train Dominoes';
    panel.appendChild(title);

    // Player name
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Your Name';
    panel.appendChild(nameLabel);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = 'Player';
    nameInput.className = 'setup-input';
    panel.appendChild(nameInput);

    // Player count
    const countLabel = document.createElement('label');
    countLabel.textContent = 'Players';
    panel.appendChild(countLabel);
    const countSelect = document.createElement('select');
    countSelect.className = 'setup-input';
    for (const n of [2, 3, 4]) {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = `${n} players`;
      if (n === 4) opt.selected = true;
      countSelect.appendChild(opt);
    }
    panel.appendChild(countSelect);

    // Difficulty
    const diffLabel = document.createElement('label');
    diffLabel.textContent = 'AI Difficulty';
    panel.appendChild(diffLabel);
    const diffSelect = document.createElement('select');
    diffSelect.className = 'setup-input';
    for (const d of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d.charAt(0).toUpperCase() + d.slice(1);
      if (d === 'medium') opt.selected = true;
      diffSelect.appendChild(opt);
    }
    panel.appendChild(diffSelect);

    // Start button
    const startBtn = document.createElement('button');
    startBtn.className = 'setup-start-btn';
    startBtn.textContent = 'Start Game';
    startBtn.addEventListener('click', () => {
      this.eventBus.emit('ui:newGame', {
        playerCount: parseInt(countSelect.value, 10),
        difficulty: diffSelect.value as Difficulty,
        playerName: nameInput.value || 'Player',
      });
      this.hide();
    });
    panel.appendChild(startBtn);

    this.overlay.appendChild(panel);
    container.appendChild(this.overlay);
  }

  show(): void {
    this.overlay.style.display = 'flex';
  }

  hide(): void {
    this.overlay.style.display = 'none';
  }
}
