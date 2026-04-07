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

      if (played.tile.isDouble) {
        // Doubles stay upright (crosswise to the train)
        this.tileRenderer.setPosition(played.tile.id, pos.x, pos.y);
        this.tileRenderer.setRotation(played.tile.id, 0);
      } else {
        // Normal tiles rotated 90° — CSS rotate happens around center,
        // so the DOM box (W x H) doesn't change. We need to offset the
        // position so the visual (H x W) box lands where the layout expects.
        const offsetX = (tileSize.height - tileSize.width) / 2;
        const offsetY = (tileSize.width - tileSize.height) / 2;
        this.tileRenderer.setPosition(
          played.tile.id,
          pos.x - offsetX,
          pos.y - offsetY,
        );
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
