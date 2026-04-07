import { EventBus } from '../utils/EventBus.js';

export class Sidebar {
  private container: HTMLElement;
  private eventBus: EventBus;
  private buttons: Map<string, HTMLButtonElement> = new Map();

  constructor(container: HTMLElement, eventBus: EventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.container.className = 'sidebar';
    this.build();
  }

  private build(): void {
    const buttonDefs: Array<{ id: string; label: string; color: string; event?: () => void }> = [
      { id: 'deal', label: 'Deal', color: '#22C55E', event: () => this.eventBus.emit('ui:nextRound', {}) },
      { id: 'draw', label: 'Draw', color: '#3B82F6', event: () => this.eventBus.emit('input:drawRequested', {}) },
      { id: 'pass', label: 'Pass', color: '#EF4444', event: () => this.eventBus.emit('input:passRequested', {}) },
      { id: 'sort', label: 'Sort', color: '#8B5CF6', event: () => this.eventBus.emit('input:sortRequested', { mode: 'total' }) },
      { id: 'undo', label: 'Undo', color: '#F59E0B', event: () => this.eventBus.emit('input:undoRequested', {}) },
      { id: 'menu', label: 'Menu', color: '#6B7280' },
    ];

    for (const def of buttonDefs) {
      const btn = document.createElement('button');
      btn.className = 'sidebar-btn';
      btn.textContent = def.label;
      btn.style.backgroundColor = def.color;
      btn.disabled = true;

      if (def.event) {
        btn.addEventListener('click', def.event);
      }

      this.container.appendChild(btn);
      this.buttons.set(def.id, btn);
    }
  }

  enableButton(id: string): void {
    const btn = this.buttons.get(id);
    if (btn) btn.disabled = false;
  }

  disableButton(id: string): void {
    const btn = this.buttons.get(id);
    if (btn) btn.disabled = true;
  }

  disableAll(): void {
    for (const btn of this.buttons.values()) {
      btn.disabled = true;
    }
  }

  pulseButton(id: string): void {
    const btn = this.buttons.get(id);
    if (btn) {
      btn.classList.add('pulse');
      setTimeout(() => btn.classList.remove('pulse'), 600);
    }
  }
}
