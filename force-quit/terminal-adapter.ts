// force-quit/terminal-adapter.ts — Hexagonal Architecture: UI adapter for terminal
// Implements UIPort using ANSI escape codes and raw stdin (no readline import in core)

import { createInterface } from "readline";
import type { Key, UIPort } from "./ports.ts";

// ─── Colors ──────────────────────────────────────────────────────────────────
const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const CYAN = "\x1b[0;36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const CLEAR_LINE = "\x1b[K";

export class TerminalUIAdapter implements UIPort {
  info(msg: string): void {
    console.log(msg);
  }

  success(msg: string): void {
    console.log(`${GREEN}✓ ${msg}${RESET}`);
  }

  warn(msg: string): void {
    console.log(`${YELLOW}${msg}${RESET}`);
  }

  error(msg: string): void {
    console.log(`${RED}✗ ${msg}${RESET}`);
  }

  showHeader(title: string): void {
    console.log(`${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${CYAN}║  ⚡ ${title.padEnd(33)}║${RESET}`);
    console.log(`${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}`);
    console.log();
  }

  showNumberedList(items: string[]): void {
    items.forEach((item, i) => {
      const num = String(i + 1).padStart(2);
      console.log(`  ${CYAN}${num})${RESET} ${item}`);
    });
    console.log();
    console.log(`  ${CYAN} 0)${RESET} Cancel`);
    console.log();
  }

  prompt(question: string): Promise<string> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  readKey(): Promise<Key> {
    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.once("data", (data: Buffer) => {
        stdin.setRawMode(false);
        stdin.pause();

        // Arrow keys: ESC [ A/B
        if (data[0] === 0x1b && data[1] === 0x5b) {
          if (data[2] === 0x41) return resolve("UP");
          if (data[2] === 0x42) return resolve("DOWN");
          return resolve("ESC");
        }
        if (data[0] === 0x1b) return resolve("ESC");
        if (data[0] === 0x20) return resolve("SPACE");
        if (data[0] === 0x0d || data[0] === 0x0a) return resolve("ENTER");
        if (data[0] === 0x03) {
          this.showCursor();
          process.exit(0);
        }
        if (data[0] === 0x61 || data[0] === 0x41) return resolve("ALL");
        if (data[0] === 0x71 || data[0] === 0x51) return resolve("QUIT");
        resolve("OTHER");
      });
    });
  }

  hideCursor(): void {
    process.stdout.write("\x1b[?25l");
  }

  showCursor(): void {
    process.stdout.write("\x1b[?25h");
  }

  renderMultiSelect(opts: {
    items: string[];
    cursor: number;
    selected: boolean[];
    total: number;
    selectedCount: number;
    isFirstDraw: boolean;
    totalLines: number;
  }): void {
    if (!opts.isFirstDraw) {
      process.stdout.write(`\x1b[${opts.totalLines}A`);
    }

    // Header
    process.stdout.write(
      `${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}${CLEAR_LINE}\n`
    );
    process.stdout.write(
      `${BOLD}${CYAN}║  ⚡ Force Quit — Multi Select        ║${RESET}${CLEAR_LINE}\n`
    );
    process.stdout.write(
      `${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}${CLEAR_LINE}\n`
    );
    process.stdout.write(
      ` Selected: ${BOLD}${CYAN}${opts.selectedCount}${RESET} / ${opts.total}${CLEAR_LINE}\n`
    );

    // App list
    for (let j = 0; j < opts.total; j++) {
      const pointer = j === opts.cursor ? `${CYAN}▸${RESET} ` : "  ";
      const check = opts.selected[j] ? `${GREEN}●${RESET}` : "○";
      const nameColor = opts.selected[j] ? GREEN : "";
      process.stdout.write(
        `  ${pointer} ${check} ${nameColor}${opts.items[j]}${RESET}${CLEAR_LINE}\n`
      );
    }

    // Footer
    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(
      `  ${CYAN}↑↓${RESET} Move  ${CYAN}Space${RESET} Toggle  ${CYAN}a${RESET} All  ${CYAN}Enter${RESET} Confirm  ${CYAN}q${RESET} Quit${CLEAR_LINE}\n`
    );
    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(`${CLEAR_LINE}\n`);
  }

  showUsage(cmd: string): void {
    console.log(`${BOLD}Usage:${RESET}`);
    console.log(`  ${cmd}              # Interactive mode — list & pick app to kill`);
    console.log(`  ${cmd} -i           # Multi-select mode — toggle multiple apps to kill`);
    console.log(`  ${cmd} <app_name>   # Kill app by name (e.g. "Safari", "Finder")`);
    console.log(`  ${cmd} -p <PID>     # Kill by process ID`);
    console.log(`  ${cmd} -l           # List running GUI applications`);
    console.log(`  ${cmd} -h           # Show this help`);
    console.log();
    console.log(`${BOLD}Examples:${RESET}`);
    console.log(`  ${cmd} Safari`);
    console.log(`  ${cmd} -p 12345`);
    console.log(`  ${cmd}              # interactive picker`);
  }

  showBulletList(title: string, items: string[]): void {
    console.log(`${BOLD}${title}${RESET}`);
    for (const item of items) {
      console.log(`  ${CYAN}•${RESET} ${item}`);
    }
  }
}
