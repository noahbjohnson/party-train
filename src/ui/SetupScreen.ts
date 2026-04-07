import { EventBus } from '../utils/EventBus.js';
import { Difficulty } from '../types.js';
import { hasSave } from '../utils/SaveManager.js';

export class SetupScreen {
  private overlay: HTMLElement;
  private eventBus: EventBus;
  private panel: HTMLElement;
  private resumeBtn: HTMLButtonElement | null = null;

  constructor(container: HTMLElement, eventBus: EventBus) {
    this.eventBus = eventBus;

    this.overlay = document.createElement('div');
    this.overlay.className = 'setup-overlay';

    this.panel = document.createElement('div');
    this.panel.className = 'setup-panel';

    const title = document.createElement('h1');
    title.textContent = 'Party Train Dominoes';
    this.panel.appendChild(title);

    // Resume button (hidden by default, shown when save exists)
    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'setup-start-btn setup-resume-btn';
    resumeBtn.textContent = 'Resume Game';
    resumeBtn.style.display = 'none';
    resumeBtn.addEventListener('click', () => {
      this.eventBus.emit('ui:resumeGame', {});
      this.hide();
    });
    this.panel.appendChild(resumeBtn);
    this.resumeBtn = resumeBtn;

    // Player name
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Your Name';
    this.panel.appendChild(nameLabel);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = 'Player';
    nameInput.className = 'setup-input';
    this.panel.appendChild(nameInput);

    // Player count
    const countLabel = document.createElement('label');
    countLabel.textContent = 'Players';
    this.panel.appendChild(countLabel);
    const countSelect = document.createElement('select');
    countSelect.className = 'setup-input';
    for (const n of [2, 3, 4]) {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = `${n} players`;
      if (n === 4) opt.selected = true;
      countSelect.appendChild(opt);
    }
    this.panel.appendChild(countSelect);

    // Difficulty
    const diffLabel = document.createElement('label');
    diffLabel.textContent = 'AI Difficulty';
    this.panel.appendChild(diffLabel);
    const diffSelect = document.createElement('select');
    diffSelect.className = 'setup-input';
    for (const d of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d.charAt(0).toUpperCase() + d.slice(1);
      if (d === 'medium') opt.selected = true;
      diffSelect.appendChild(opt);
    }
    this.panel.appendChild(diffSelect);

    // Start button
    const startBtn = document.createElement('button');
    startBtn.className = 'setup-start-btn';
    startBtn.textContent = 'New Game';
    startBtn.addEventListener('click', () => {
      this.eventBus.emit('ui:newGame', {
        playerCount: parseInt(countSelect.value, 10),
        difficulty: diffSelect.value as Difficulty,
        playerName: nameInput.value || 'Player',
      });
      this.hide();
    });
    this.panel.appendChild(startBtn);

    this.overlay.appendChild(this.panel);
    container.appendChild(this.overlay);
  }

  show(): void {
    // Show/hide resume button based on whether a save exists
    if (this.resumeBtn) {
      this.resumeBtn.style.display = hasSave() ? 'block' : 'none';
    }
    this.overlay.style.display = 'flex';
  }

  hide(): void {
    this.overlay.style.display = 'none';
  }
}
