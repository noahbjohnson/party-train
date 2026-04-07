export interface GridConfig {
  canvasWidth: number;
  canvasHeight: number;
  sidebarWidth: number;
  infoPanelWidth: number;
  handAreaHeight: number;
  topBarHeight: number;
  trainRowHeight: number;
  tileWidth: number;
  tileHeight: number;
  tilePadding: number;
}

export interface TrainRowLayout {
  trainId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rowIndex: number;
}

export interface HandLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  tilesPerRow: number;
}

export interface LayoutResult {
  trainRows: TrainRowLayout[];
  hand: HandLayout;
  trainAreaX: number;
  trainAreaY: number;
  trainAreaWidth: number;
  trainAreaHeight: number;
}

const DEFAULT_CONFIG: GridConfig = {
  canvasWidth: 1280,
  canvasHeight: 720,
  sidebarWidth: 100,
  infoPanelWidth: 200,
  handAreaHeight: 150,
  topBarHeight: 40,
  trainRowHeight: 70,
  tileWidth: 40,
  tileHeight: 80,
  tilePadding: 4,
};

export class GridLayout {
  private config: GridConfig;

  constructor(config?: Partial<GridConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  update(canvasWidth: number, canvasHeight: number): void {
    this.config.canvasWidth = canvasWidth;
    this.config.canvasHeight = canvasHeight;
  }

  getConfig(): GridConfig {
    return { ...this.config };
  }

  computeLayout(trainIds: string[], humanTrainId: string): LayoutResult {
    const { canvasWidth, canvasHeight, sidebarWidth, infoPanelWidth, handAreaHeight, topBarHeight, trainRowHeight } = this.config;

    const trainAreaX = sidebarWidth;
    const trainAreaY = topBarHeight;
    const trainAreaWidth = canvasWidth - sidebarWidth - infoPanelWidth;
    const trainAreaHeight = canvasHeight - topBarHeight - handAreaHeight;

    // Sort trains: AI trains first, party train, then human train last
    const sortedTrainIds = [
      ...trainIds.filter(id => id !== humanTrainId && id !== 'party'),
      'party',
      humanTrainId,
    ].filter(id => trainIds.includes(id) || id === 'party');

    const trainRows: TrainRowLayout[] = sortedTrainIds.map((trainId, i) => ({
      trainId,
      x: trainAreaX,
      y: trainAreaY + i * trainRowHeight,
      width: trainAreaWidth,
      height: trainRowHeight,
      rowIndex: i,
    }));

    const handTileWidth = 50;
    const handTileHeight = 100;
    const handAreaWidth = trainAreaWidth;
    const tilesPerRow = Math.floor(handAreaWidth / (handTileWidth + this.config.tilePadding));

    const hand: HandLayout = {
      x: trainAreaX,
      y: canvasHeight - handAreaHeight,
      width: handAreaWidth,
      height: handAreaHeight,
      tileWidth: handTileWidth,
      tileHeight: handTileHeight,
      tilesPerRow,
    };

    return {
      trainRows,
      hand,
      trainAreaX,
      trainAreaY,
      trainAreaWidth,
      trainAreaHeight,
    };
  }

  getTilePositionInRow(row: TrainRowLayout, tileIndex: number): { x: number; y: number } {
    const { tileWidth, tilePadding } = this.config;
    return {
      x: row.x + tileIndex * (tileWidth + tilePadding) + tilePadding,
      y: row.y + (row.height - this.config.tileHeight) / 2,
    };
  }

  getHandTilePosition(hand: HandLayout, tileIndex: number): { x: number; y: number } {
    const row = Math.floor(tileIndex / hand.tilesPerRow);
    const col = tileIndex % hand.tilesPerRow;
    return {
      x: hand.x + col * (hand.tileWidth + this.config.tilePadding) + this.config.tilePadding,
      y: hand.y + row * (hand.tileHeight + this.config.tilePadding) + this.config.tilePadding,
    };
  }
}
