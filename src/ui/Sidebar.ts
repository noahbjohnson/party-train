import { EventBus } from '../utils/EventBus.js';

export class Sidebar {
  private container: HTMLElement;
  private eventBus: EventBus;
  private buttons: Map<string, HTMLButtonElement> = new Map();
  private menuOverlay: HTMLElement | null = null;
  private soundEnabled: boolean = true;
  private onHelpToggle: (() => void) | null = null;

  constructor(container: HTMLElement, eventBus: EventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.container.className = 'sidebar';
    this.build();
  }

  setHelpToggle(callback: () => void): void {
    this.onHelpToggle = callback;
  }

  private build(): void {
    const buttonDefs: Array<{ id: string; label: string; color: string; event?: () => void }> = [
      { id: 'deal', label: 'Deal', color: '#22C55E', event: () => this.eventBus.emit('ui:nextRound', {}) },
      { id: 'draw', label: 'Draw', color: '#3B82F6', event: () => this.eventBus.emit('input:drawRequested', {}) },
      { id: 'pass', label: 'Pass', color: '#EF4444', event: () => this.eventBus.emit('input:passRequested', {}) },
      { id: 'sort', label: 'Sort', color: '#8B5CF6', event: () => this.eventBus.emit('input:sortRequested', { mode: 'total' }) },
      { id: 'undo', label: 'Undo', color: '#F59E0B', event: () => this.eventBus.emit('input:undoRequested', {}) },
      { id: 'menu', label: 'Menu', color: '#6B7280', event: () => this.toggleMenu() },
      { id: 'help', label: 'Help', color: '#6B7280', event: () => this.onHelpToggle?.() },
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

    // Menu and Help buttons are always enabled
    const menuBtn = this.buttons.get('menu');
    if (menuBtn) menuBtn.disabled = false;
    const helpBtn = this.buttons.get('help');
    if (helpBtn) helpBtn.disabled = false;
  }

  private toggleMenu(): void {
    if (this.menuOverlay) {
      this.closeMenu();
      return;
    }
    this.openMenu();
  }

  private openMenu(): void {
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';

    const panel = document.createElement('div');
    panel.className = 'menu-panel';

    const title = document.createElement('h2');
    title.textContent = 'Menu';
    panel.appendChild(title);

    // New Game button
    const newGameBtn = document.createElement('button');
    newGameBtn.className = 'menu-btn';
    newGameBtn.textContent = 'New Game';
    newGameBtn.addEventListener('click', () => {
      this.closeMenu();
      this.eventBus.emit('ui:restartGame', {});
    });
    panel.appendChild(newGameBtn);

    // Sound toggle button
    const soundBtn = document.createElement('button');
    soundBtn.className = 'menu-btn';
    soundBtn.textContent = this.soundEnabled ? 'Sound Off' : 'Sound On';
    soundBtn.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      soundBtn.textContent = this.soundEnabled ? 'Sound Off' : 'Sound On';
      this.eventBus.emit('ui:soundToggle', {});
    });
    panel.appendChild(soundBtn);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'menu-btn menu-btn-close';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
      this.closeMenu();
    });
    panel.appendChild(closeBtn);

    overlay.appendChild(panel);

    // Close on overlay background click
    overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === overlay) {
        this.closeMenu();
      }
    });

    document.body.appendChild(overlay);
    this.menuOverlay = overlay;
  }

  private closeMenu(): void {
    if (this.menuOverlay) {
      this.menuOverlay.remove();
      this.menuOverlay = null;
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
    for (const [id, btn] of this.buttons) {
      // Menu and Help buttons are always enabled
      if (id === 'menu' || id === 'help') continue;
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

  updateSoundLabel(enabled: boolean): void {
    this.soundEnabled = enabled;
  }
}
