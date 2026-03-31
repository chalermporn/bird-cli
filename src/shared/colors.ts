// shared/colors.ts — Shared terminal styling via picocolors
// Dark-theme-friendly palette. Single source of truth for all modules.

import pc from "picocolors";
export { pc };

// ANSI escape not provided by picocolors
export const CLEAR_LINE = "\x1b[K";

// ─── Dark-theme semantic helpers ─────────────────────────────────────────────

/** Section titles, headers */
export const heading = (s: string) => pc.bold(pc.white(s));

/** Primary accent — frames, interactive keys */
export const accent = (s: string) => pc.cyan(s);

/** Primary accent bold — box borders, active selections */
export const accentBold = (s: string) => pc.bold(pc.cyan(s));

/** Success — checkmarks, completions */
export const ok = (s: string) => pc.green(s);

/** Warning — counts, caution */
export const warn = (s: string) => pc.yellow(s);

/** Error — failures, unknown */
export const err = (s: string) => pc.red(s);

/** Subtle — comments, descriptions, secondary info */
export const dim = (s: string) => pc.dim(s);

/** Highlight — active item label */
export const highlight = (s: string) => pc.bold(pc.green(s));

/** Info — section labels (magenta reads well on dark) */
export const info = (s: string) => pc.magenta(s);

// ─── Icon set ────────────────────────────────────────────────────────────────

export const icons = {
  // Status
  ok:     "✔",
  fail:   "✖",
  warn:   "▲",
  info:   "◆",
  // Navigation
  pointer: "›",
  bullet:  "∙",
  arrow:   "→",
  arrowL:  "←",
  // Selection
  on:     "◉",
  off:    "○",
  // Decorative
  bar:    "│",
  dot:    "·",
} as const;
