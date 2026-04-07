import { EventBus } from '../utils/EventBus.js';

export class InputHandler {
  private eventBus: EventBus;
  private gameArea: HTMLElement;
  private enabled: boolean = false;

  constructor(eventBus: EventBus, gameArea: HTMLElement) {
    this.eventBus = eventBus;
    this.gameArea = gameArea;

    this.gameArea.addEventListener('click', this.handleClick.bind(this));
    this.setupKeyboard();
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  private handleClick(e: MouseEvent): void {
    if (!this.enabled) return;

    const target = e.target as HTMLElement;
    const tileEl = target.closest('.tile') as HTMLElement | null;
    const trainRow = target.closest('.train-row') as HTMLElement | null;

    if (tileEl?.dataset['tileId']) {
      const tileId = parseInt(tileEl.dataset['tileId'], 10);
      this.eventBus.emit('input:tileSelected', { tileId });
      return;
    }

    if (trainRow?.dataset['trainId']) {
      const trainId = trainRow.dataset['trainId'];
      this.eventBus.emit('input:trainSelected', { trainId });
      return;
    }
  }

  private setupKeyboard(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.enabled) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.eventBus.emit('input:drawRequested', {});
          break;
        case 'Escape':
          // Deselect handled by game layer
          break;
        case 's':
        case 'S':
          this.eventBus.emit('input:sortRequested', { mode: 'total' });
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.eventBus.emit('input:undoRequested', {});
          }
          break;
      }
    });
  }
}
