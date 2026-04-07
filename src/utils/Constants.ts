export const PIP_COLORS: Record<number, string> = {
  0: '#808080',
  1: '#FF0000',
  2: '#0000FF',
  3: '#00AA00',
  4: '#00CCCC',
  5: '#FF00FF',
  6: '#AA4400',
  7: '#FF8800',
  8: '#008888',
  9: '#000088',
  10: '#CCAA00',
  11: '#DDDDDD',
  12: '#222222',
};

export const PLAYER_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#EAB308'];

export const TABLE_COLOR = '#008B8B';

export const AI_THINK_DELAY: Record<string, { min: number; max: number }> = {
  easy: { min: 500, max: 800 },
  medium: { min: 800, max: 1200 },
  hard: { min: 1200, max: 2000 },
};

export const ANIMATION_DURATION = {
  tilePlay: 300,
  tileDraw: 250,
  markerToggle: 200,
};
