// shared/multi-select.ts — Shared multi-select TUI component
// Reusable interactive picker with cursor navigation, toggle, and select-all.
// Used by force-quit and install modules.

import { readKey } from "./keys.ts";
import { hideCursor, showCursor } from "./terminal.ts";
import { pc, CLEAR_LINE, accentBold, accent, ok, dim, highlight, icons } from "./colors.ts";

// ─── Options ─────────────────────────────────────────────────────────────────

export interface MultiSelectOptions {
  /** Title shown in the box header */
  title: string;
  /** Items to display for selection */
  items: string[];
  /** Whether items start selected (default: false) */
  defaultSelected?: boolean;
  /** Cursor pointer symbol (default: "▸") */
  pointer?: string;
  /** Label for Enter key in footer (default: "Confirm") */
  confirmLabel?: string;
}

// ─── Render ──────────────────────────────────────────────────────────────────

export function renderMultiSelect(opts: {
  title: string;
  items: string[];
  cursor: number;
  selected: boolean[];
  total: number;
  selectedCount: number;
  isFirstDraw: boolean;
  totalLines: number;
  pointer: string;
  confirmLabel: string;
}): void {
  if (!opts.isFirstDraw) {
    process.stdout.write(`\x1b[${opts.totalLines}A`);
  }

  const w = 38;
  process.stdout.write(
    `${accentBold(`┌${'─'.repeat(w)}┐`)}${CLEAR_LINE}\n`,
  );
  process.stdout.write(
    `${accentBold(`│`)}  ${pc.bold(pc.white(opts.title.padEnd(w - 2)))}${accentBold(`│`)}${CLEAR_LINE}\n`,
  );
  process.stdout.write(
    `${accentBold(`└${'─'.repeat(w)}┘`)}${CLEAR_LINE}\n`,
  );
  process.stdout.write(
    ` ${dim('Selected:')} ${accentBold(String(opts.selectedCount))} ${dim('/')} ${dim(String(opts.total))}${CLEAR_LINE}\n`,
  );

  for (let j = 0; j < opts.total; j++) {
    const ptr = j === opts.cursor ? accent(`${icons.pointer} `) : "  ";
    const check = opts.selected[j] ? ok(icons.on) : dim(icons.off);
    const label = opts.selected[j]
      ? highlight(opts.items[j]!)
      : opts.items[j];
    process.stdout.write(
      `  ${ptr} ${check} ${label}${CLEAR_LINE}\n`,
    );
  }

  process.stdout.write(`${CLEAR_LINE}\n`);
  process.stdout.write(
    `  ${dim(`${icons.dot} ↑↓ Move  Space Toggle  a All  Enter ${opts.confirmLabel}  q Quit`)}${CLEAR_LINE}\n`,
  );
  process.stdout.write(`${CLEAR_LINE}\n`);
  process.stdout.write(`${CLEAR_LINE}\n`);
  process.stdout.write(`${CLEAR_LINE}\n`);
}

// ─── Multi-select loop ──────────────────────────────────────────────────────

/**
 * Run an interactive multi-select TUI.
 * Returns indices of selected items, or empty array if cancelled.
 */
export async function multiSelect(opts: MultiSelectOptions): Promise<number[]> {
  const {
    items,
    title,
    defaultSelected = false,
    pointer = "▸",
    confirmLabel = "Confirm",
  } = opts;

  const count = items.length;
  let cursor = 0;
  const selected = new Array<boolean>(count).fill(defaultSelected);

  hideCursor();

  const cleanup = () => showCursor();
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(0); });
  process.on("SIGTERM", () => { cleanup(); process.exit(0); });

  const totalLines = 4 + count + 5;
  let firstDraw = true;

  while (true) {
    const selCount = selected.filter(Boolean).length;

    renderMultiSelect({
      title,
      items,
      cursor,
      selected,
      total: count,
      selectedCount: selCount,
      isFirstDraw: firstDraw,
      totalLines,
      pointer,
      confirmLabel,
    });
    firstDraw = false;

    const key = await readKey(cleanup);

    switch (key) {
      case "UP":
        cursor = (cursor - 1 + count) % count;
        break;
      case "DOWN":
        cursor = (cursor + 1) % count;
        break;
      case "SPACE":
        selected[cursor] = !selected[cursor];
        break;
      case "ALL": {
        const allOn = selected.every(Boolean);
        selected.fill(!allOn);
        break;
      }
      case "ENTER": {
        showCursor();
        console.log();
        return selected.reduce<number[]>((acc, sel, i) => {
          if (sel) acc.push(i);
          return acc;
        }, []);
      }
      case "QUIT":
      case "ESC":
        showCursor();
        console.log();
        return [];
    }
  }
}
