import { Train } from '../types.js';
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
    const tileSize = this.layout.getScaledTrainTileSize(rowLayout);
    const tilesInfo = train.tiles.map(pt => ({ isDouble: pt.tile.isDouble }));

    for (let i = 0; i < train.tiles.length; i++) {
      const played = train.tiles[i]!;
      const pos = this.layout.getTilePositionInRow(rowLayout, i, tilesInfo);

      // Ensure tile element exists
      let el = this.tileRenderer.getElement(played.tile.id);
      if (!el) {
        this.tileRenderer.createTileElement(played.tile, true);
      }

      // Apply scaled size for train tiles
      this.tileRenderer.setSize(played.tile.id, tileSize.width, tileSize.height);

      // Position already accounts for rotation offset (calculated in GridLayout)
      this.tileRenderer.setPosition(played.tile.id, pos.x, pos.y);

      if (played.tile.isDouble) {
        this.tileRenderer.setRotation(played.tile.id, 0);
      } else {
        const rotation = played.orientation === 'normal' ? 90 : -90;
        this.tileRenderer.setRotation(played.tile.id, rotation);
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
