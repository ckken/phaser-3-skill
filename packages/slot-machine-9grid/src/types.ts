// 共享类型定义
export interface SymbolData {
  id: string;
  color: number;
  label: string;
  multiplier: number;
}

export const SYMBOLS: SymbolData[] = [
  { id: 'seven', color: 0xff3333, label: '7', multiplier: 10 },
  { id: 'diamond', color: 0x33ffff, label: '◆', multiplier: 8 },
  { id: 'bell', color: 0xffdd33, label: '🔔', multiplier: 5 },
  { id: 'cherry', color: 0xff6699, label: '🍒', multiplier: 3 },
  { id: 'lemon', color: 0xffff33, label: '🍋', multiplier: 2 },
  { id: 'grape', color: 0xaa33ff, label: '🍇', multiplier: 2 },
  { id: 'star', color: 0xffaa00, label: '★', multiplier: 1.5 },
  { id: 'bar', color: 0x66ff66, label: 'BAR', multiplier: 4 },
];

// 主题色
export const THEME = {
  bgDark: 0x0d0d1a,
  bgPanel: 0x1a1a2e,
  gold: 0xffd700,
  red: 0xc41e3a
};