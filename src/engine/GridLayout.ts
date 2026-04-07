export interface GridConfig {
  canvasWidth: number;
  canvasHeight: number;
  sidebarWidth: number;
  infoPanelWidth: number;
  handAreaHeight: number;
  topBarHeight: number;
  trainRowHeight: number;
  tilePadding: number;
}

export interface TrainRowLayout {
  trainId: string;
  x: number;      // relative to game area container
  y: number;      // relative to game area container
  width: number;
  height: number;
  rowIndex: number;
  tileScale: number;  // scale factor for tiles in this row
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
  trainAreaWidth: number;
  trainAreaHeight: number;
}

// Atlas tile dimensions (source of truth from TileAtlas)
const ATLAS_TILE_W = 60;
const ATLAS_TILE_H = 120;

const DEFAULT_CONFIG: GridConfig = {
  canvasWidth: 1280,
  canvasHeight: 720,
  sidebarWidth: 100,
  infoPanelWidth: 200,
  handAreaHeight: 160,
  topBarHeight: 40,
  trainRowHeight: 80,
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

    const trainAreaWidth = canvasWidth - sidebarWidth - infoPanelWidth;
    const trainAreaHeight = canvasHeight - topBarHeight - handAreaHeight;

    // Sort trains: AI trains first, party train, then human train last
    const sortedTrainIds = [
      ...trainIds.filter(id => id !== humanTrainId && id !== 'party'),
      'party',
      humanTrainId,
    ].filter(id => trainIds.includes(id) || id === 'party');

    // Scale tiles to fit within row height (with padding)
    const rowPadding = 8;
    const availableHeight = trainRowHeight - rowPadding * 2;
    const tileScale = Math.min(1, availableHeight / ATLAS_TILE_H);

    const trainRows: TrainRowLayout[] = sortedTrainIds.map((trainId, i) => ({
      trainId,
      x: 0,   // relative to game area
      y: i * trainRowHeight,
      width: trainAreaWidth,
      height: trainRowHeight,
      rowIndex: i,
      tileScale,
    }));

    // Hand tiles are bigger
    const handTileScale = 0.85;
    const handTileWidth = Math.floor(ATLAS_TILE_W * handTileScale);
    const handTileHeight = Math.floor(ATLAS_TILE_H * handTileScale);
    const tilesPerRow = Math.floor(trainAreaWidth / (handTileWidth + this.config.tilePadding));

    const hand: HandLayout = {
      x: 0,
      y: 0,
      width: trainAreaWidth,
      height: handAreaHeight,
      tileWidth: handTileWidth,
      tileHeight: handTileHeight,
      tilesPerRow,
    };

    return {
      trainRows,
      hand,
      trainAreaWidth,
      trainAreaHeight,
    };
  }

  /**
   * Get position for a tile in a train row.
   * Normal tiles are rotated 90° (landscape): they occupy scaledH x scaledW space.
   * Doubles stay upright: they occupy scaledW x scaledH space (but row height limits them).
   */
  getTilePositionInRow(
    row: TrainRowLayout,
    tileIndex: number,
    tilesInfo: Array<{ isDouble: boolean }>,
  ): { x: number; y: number } {
    const scaledW = Math.floor(ATLAS_TILE_W * row.tileScale);
    const scaledH = Math.floor(ATLAS_TILE_H * row.tileScale);

    // Sum up x offsets for all tiles before this one
    let x = row.x + this.config.tilePadding;
    for (let i = 0; i < tileIndex; i++) {
      const info = tilesInfo[i];
      if (info?.isDouble) {
        // Doubles are upright: width = scaledW
        x += scaledW + this.config.tilePadding;
      } else {
        // Normal tiles are landscape: width = scaledH (height becomes width when rotated)
        x += scaledH + this.config.tilePadding;
      }
    }

    const currentIsDouble = tilesInfo[tileIndex]?.isDouble ?? false;
    let y: number;
    if (currentIsDouble) {
      // Double stays upright, center vertically
      y = row.y + (row.height - scaledH) / 2;
    } else {
      // Normal tile rotated 90°: element is still scaledW x scaledH in DOM,
      // but visually it's scaledH x scaledW. Center the scaledW (visual height) vertically.
      y = row.y + (row.height - scaledW) / 2;
    }

    return { x, y };
  }

  getScaledTrainTileSize(row: TrainRowLayout): { width: number; height: number } {
    return {
      width: Math.floor(ATLAS_TILE_W * row.tileScale),
      height: Math.floor(ATLAS_TILE_H * row.tileScale),
    };
  }

  getHandTilePosition(hand: HandLayout, tileIndex: number): { x: number; y: number } {
    const row = Math.floor(tileIndex / hand.tilesPerRow);
    const col = tileIndex % hand.tilesPerRow;
    return {
      x: col * (hand.tileWidth + this.config.tilePadding) + this.config.tilePadding,
      y: row * (hand.tileHeight + this.config.tilePadding) + this.config.tilePadding,
    };
  }
}
