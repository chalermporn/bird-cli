// shared/colors.ts — Shared terminal styling via picocolors
// Dark-theme-friendly palette. Single source of truth for all modules.

import pc from "picocolors";
export { pc };

// ANSI escape not provided by picocolors
export const CLEAR_LINE = "\x1b[K";
