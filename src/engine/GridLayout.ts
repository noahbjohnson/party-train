export interface GridConfig {
  canvasWidth: number;
  canvasHeight: number;
  sidebarWidth: number;
  infoPanelWidth: number;
  handAreaHeight: number;
  topBarHeight: number;
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
  infoPanelWidth: 180,
  handAreaHeight: 120,
  topBarHeight: 40,
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

    // Responsive adjustments for mobile landscape
    if (canvasHeight <= 500) {
      this.config.sidebarWidth = 70;
      this.config.infoPanelWidth = 140;
      this.config.topBarHeight = 28;
      this.config.handAreaHeight = 80;
    } else {
      this.config.sidebarWidth = 100;
      this.config.infoPanelWidth = 180;
      this.config.topBarHeight = 40;
      this.config.handAreaHeight = 120;
    }
  }

  getConfig(): GridConfig {
    return { ...this.config };
  }

  computeLayout(trainIds: string[], humanTrainId: string): LayoutResult {
    const { canvasWidth, canvasHeight, sidebarWidth, infoPanelWidth, handAreaHeight, topBarHeight } = this.config;

    const trainAreaWidth = canvasWidth - sidebarWidth - infoPanelWidth;
    const trainAreaHeight = canvasHeight - topBarHeight - handAreaHeight;

    // Sort trains: AI trains first, party train, then human train last
    const sortedTrainIds = [
      ...trainIds.filter(id => id !== humanTrainId && id !== 'party'),
      'party',
      humanTrainId,
    ].filter(id => trainIds.includes(id) || id === 'party');

    // Compute row height from available space, capped at 100px max
    const numRows = sortedTrainIds.length;
    const computedRowHeight = numRows > 0 ? Math.min(100, Math.floor(trainAreaHeight / numRows)) : 100;

    // Scale tiles to fit within row height (with padding)
    const rowPadding = 8;
    const availableHeight = computedRowHeight - rowPadding * 2;
    const tileScale = Math.min(1, availableHeight / ATLAS_TILE_H);

    const trainRows: TrainRowLayout[] = sortedTrainIds.map((trainId, i) => ({
      trainId,
      x: 0,   // relative to game area
      y: i * computedRowHeight,
      width: trainAreaWidth,
      height: computedRowHeight,
      rowIndex: i,
      tileScale,
    }));

    // Hand tiles are landscape (rotated 90°), scale to fit hand area height
    const handPadding = 8;
    const handAvailable = handAreaHeight - handPadding * 2;
    // Visual height of rotated tile = DOM width = ATLAS_TILE_W * scale
    // We want visual height to fit in handAvailable
    const handTileScale = Math.min(0.7, handAvailable / ATLAS_TILE_W);
    const handTileWidth = Math.floor(ATLAS_TILE_W * handTileScale);   // DOM element width
    const handTileHeight = Math.floor(ATLAS_TILE_H * handTileScale);  // DOM element height
    const handVisualWidth = handTileHeight; // after rotation, visual width = DOM height
    const tilesPerRow = Math.floor(trainAreaWidth / (handVisualWidth + this.config.tilePadding));

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
   * Get the final DOM position for a tile in a train row.
   * Accounts for CSS rotation offset so positions are ready to use directly.
   * Normal tiles are rotated 90° (landscape): visually scaledH x scaledW.
   * Doubles stay upright: scaledW x scaledH.
   */
  getTilePositionInRow(
    row: TrainRowLayout,
    tileIndex: number,
    tilesInfo: Array<{ isDouble: boolean }>,
  ): { x: number; y: number } {
    const scaledW = Math.floor(ATLAS_TILE_W * row.tileScale);
    const scaledH = Math.floor(ATLAS_TILE_H * row.tileScale);
    // Rotation offset: CSS rotate(90deg) rotates around center, shifting the
    // visual box relative to the DOM box. We bake this into positions here.
    const rotOffsetX = (scaledH - scaledW) / 2;
    const rotOffsetY = (scaledW - scaledH) / 2;

    // Sum up visual x offsets for all tiles before this one
    let visualX = row.x + this.config.tilePadding;
    for (let i = 0; i < tileIndex; i++) {
      const info = tilesInfo[i];
      if (info?.isDouble) {
        visualX += scaledW + this.config.tilePadding;
      } else {
        visualX += scaledH + this.config.tilePadding;
      }
    }

    const currentIsDouble = tilesInfo[tileIndex]?.isDouble ?? false;
    if (currentIsDouble) {
      return {
        x: visualX,
        y: row.y + (row.height - scaledH) / 2,
      };
    } else {
      // Convert visual position to DOM position by applying rotation offset.
      // CSS rotate(90deg) around center: visual_topleft = (domX + (W-H)/2, domY + (H-W)/2)
      // So: domX = visualX + (H-W)/2 = visualX + rotOffsetX
      //     domY = visualY + (W-H)/2 = visualY + rotOffsetY
      return {
        x: visualX + rotOffsetX,
        y: row.y + (row.height - scaledW) / 2 + rotOffsetY,
      };
    }
  }

  getScaledTrainTileSize(row: TrainRowLayout): { width: number; height: number } {
    return {
      width: Math.floor(ATLAS_TILE_W * row.tileScale),
      height: Math.floor(ATLAS_TILE_H * row.tileScale),
    };
  }

  /**
   * Get DOM position for a hand tile (landscape/rotated 90°).
   * Bakes in rotation offset so visual position is correct.
   */
  getHandTilePosition(hand: HandLayout, tileIndex: number): { x: number; y: number } {
    const visualW = hand.tileHeight; // rotated: visual width = DOM height
    const visualH = hand.tileWidth;  // rotated: visual height = DOM width
    const rotOffsetX = (hand.tileHeight - hand.tileWidth) / 2;
    const rotOffsetY = (hand.tileWidth - hand.tileHeight) / 2;

    const row = Math.floor(tileIndex / hand.tilesPerRow);
    const col = tileIndex % hand.tilesPerRow;

    // Visual position
    const visualX = col * (visualW + this.config.tilePadding) + this.config.tilePadding;
    const visualY = row * (visualH + this.config.tilePadding) + this.config.tilePadding;

    // Convert to DOM position
    return {
      x: visualX + rotOffsetX,
      y: visualY + rotOffsetY,
    };
  }
}
