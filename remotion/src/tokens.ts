// === Claude 實戰 — Editorial Doc 設計系統 (一次性) ===
// 不要動這個檔；要改設計請走 Style System Agent。

// 30fps — talking head + 疊層不需要 60fps；Studio 預覽流暢、render 時間減半。
// OffthreadVideo 從 60fps 源片自動降採樣，視覺無差。
export const FPS = 30;

// Canvas: 1080p native (源檔 1920×1080)
export const W = 1920;
export const H = 1080;

// === Editorial Doc 色票 ===
export const C = {
  // 背景：暖灰米白（疊層用）
  paper: "#F4EFE6",
  paperSoft: "rgba(244,239,230,0.92)",
  ink: "#1A1A1A",
  inkSoft: "rgba(26,26,26,0.72)",
  rule: "rgba(26,26,26,0.12)",

  // 重點色（高飽和橘 — Editorial Doc 招牌色）
  accent: "#E85D2F",
  accentSoft: "rgba(232,93,47,0.12)",
  accentBorder: "rgba(232,93,47,0.32)",

  // 第二重點（深森林綠）
  forest: "#2E5D4F",
  forestSoft: "rgba(46,93,79,0.10)",

  // 警示／提示
  warn: "#C77700",
  muted: "#8A8478",
} as const;

// === 字體 ===
export const FONT = {
  serif: "'Source Serif 4', 'Noto Serif TC', Georgia, serif", // 主標
  sans: "'Inter', 'Noto Sans TC', -apple-system, system-ui, sans-serif", // 內文
  mono: "'JetBrains Mono', ui-monospace, monospace", // 代碼/技術名詞
} as const;

// === 字級（Editorial 風格：克制、層次清楚）===
export const SIZE = {
  xs: 18,
  sm: 22,
  base: 28,
  lg: 36,
  xl: 48,
  display: 72,
} as const;

// === 安全區（疊層只能在邊邊出現，中央留給講話者）===
export const SAFE = {
  top: 48,
  bottom: 48,
  left: 48,
  right: 48,
  // 講話者（畫面中央人物）禁區：水平 30%~70%、垂直 20%~95% 不可疊內容
  speakerH: { from: 0.3, to: 0.7 },
  speakerV: { from: 0.2, to: 0.95 },
} as const;
