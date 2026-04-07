import { Train, PlayedTile } from '../types.js';
import { TileRenderer } from './TileRenderer.js';
import { GridLayout, TrainRowLayout } from './GridLayout.js';

export class TrainRowRenderer {
  private layout: GridLayout;
  private tileRenderer: TileRenderer;

  constructor(layout: GridLayout, tileRenderer: TileRenderer) {
    this.layout = layout;
    this.tileRenderer = tileRenderer;
  }

  renderTrain(train: Train, rowLayout: TrainRowLayout): void {
    for (let i = 0; i < train.tiles.length; i++) {
      const played = train.tiles[i]!;
      const pos = this.layout.getTilePositionInRow(rowLayout, i);

      // Ensure tile element exists
      let el = this.tileRenderer.getElement(played.tile.id);
      if (!el) {
        this.tileRenderer.createTileElement(played.tile, true);
      }

      this.tileRenderer.setPosition(played.tile.id, pos.x, pos.y);

      // Doubles are rotated 90 degrees
      if (played.tile.isDouble) {
        this.tileRenderer.setRotation(played.tile.id, 90);
      } else {
        this.tileRenderer.setRotation(played.tile.id, 0);
      }
    }
  }

  renderAllTrains(trains: Map<string, Train>, trainRows: TrainRowLayout[]): void {
    for (const row of trainRows) {
      const train = trains.get(row.trainId);
      if (train) {
        this.renderTrain(train, row);
      }
    }
  }
}
