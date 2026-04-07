export class HelpOverlay {
  private overlay: HTMLElement;

  constructor(container: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'help-overlay';
    this.overlay.style.display = 'none';

    // Close when clicking the backdrop
    this.overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    const panel = document.createElement('div');
    panel.className = 'help-panel';

    // Header with close button
    const header = document.createElement('div');
    header.className = 'help-header';

    const title = document.createElement('h2');
    title.textContent = 'Party Train Dominoes Rules';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'help-close-btn';
    closeBtn.textContent = 'X';
    closeBtn.addEventListener('click', () => this.hide());
    header.appendChild(closeBtn);

    panel.appendChild(header);

    // Scrollable content area
    const content = document.createElement('div');
    content.className = 'help-content';

    this.buildRulesContent(content);

    panel.appendChild(content);
    this.overlay.appendChild(panel);
    container.appendChild(this.overlay);
  }

  private buildRulesContent(container: HTMLElement): void {
    this.addSection(container, 'Overview', [
      'Party Train uses a Double-12 domino set (91 tiles).',
      'Play consists of 13 rounds, starting with 12-12 as the hub, then 11-11, down to 0-0.',
      'Lowest total score across all rounds wins.',
    ]);

    this.addSection(container, 'Setup', [
      'The starting double for the round is placed in the center hub.',
      'Tiles are dealt to each player; remaining tiles form the boneyard (draw pile).',
      '2 players: 15 tiles each | 3 players: 13 each | 4 players: 11 each.',
    ]);

    this.addSection(container, 'Trains', [
      'Each player has a personal train extending from the hub.',
      'There is one shared Party Train that any player can always play on.',
      'The first tile on any train must match the hub double value.',
    ]);

    this.addSection(container, 'On Your Turn', [
      'Play one tile on an eligible train: your own, the Party Train, or any train marked open.',
      'The tile must match the open end of the chosen train.',
      'If you play on your own train, your open marker (if any) is removed.',
    ]);

    this.addSection(container, 'Drawing', [
      'If you have no legal play, draw one tile from the boneyard.',
      'If the drawn tile is playable, you may play it immediately.',
      'If not (or the boneyard is empty), your train is marked open and your turn ends.',
    ]);

    this.addSection(container, 'Doubles', [
      'Playing a double gives you a bonus play -- you must play another tile immediately.',
      'The bonus tile can go on any eligible train, not just the double\'s train.',
      'If you cannot play after a double, draw. If still stuck, mark your train open.',
      'An unsatisfied double forces the next player(s) to cover it before any other play.',
    ]);

    this.addSection(container, 'Open Markers', [
      'When your train is marked open, any player can play on it.',
      'Successfully playing on your own train removes the marker.',
      'Playing on other trains or the Party Train does NOT remove your marker.',
    ]);

    this.addSection(container, 'Round End & Scoring', [
      'A round ends when a player empties their hand or all players are blocked.',
      'Each player scores the pip total of tiles remaining in their hand.',
      'After all 13 rounds, the player with the lowest total score wins.',
    ]);
  }

  private addSection(container: HTMLElement, heading: string, bullets: string[]): void {
    const section = document.createElement('div');
    section.className = 'help-section';

    const h3 = document.createElement('h3');
    h3.textContent = heading;
    section.appendChild(h3);

    const ul = document.createElement('ul');
    for (const text of bullets) {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    }
    section.appendChild(ul);

    container.appendChild(section);
  }

  show(): void {
    this.overlay.style.display = 'flex';
  }

  hide(): void {
    this.overlay.style.display = 'none';
  }

  toggle(): void {
    if (this.overlay.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }
}
