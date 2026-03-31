// install/terminal-adapter.ts — Hexagonal Architecture: Terminal UI adapter
// Implements UIPort using ANSI escape codes and raw stdin

import { createInterface } from "readline";
import type { Key, ScriptInfo, UIPort } from "./ports.ts";

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
    console.log(`${BOLD}${msg}${RESET}`);
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

  showUsage(cmd: string): void {
    console.log(`${BOLD}Usage:${RESET}`);
    console.log(`  ${cmd}              # Install all scripts to ~/bin`);
    console.log(`  ${cmd} -i           # Interactive select — pick scripts to install`);
    console.log(`  ${cmd} --uninstall  # Remove installed scripts`);
    console.log(`  ${cmd} --list       # List what would be installed`);
    console.log(`  ${cmd} -h           # Show this help`);
  }

  showScriptList(scripts: ScriptInfo[], installDir: string): void {
    console.log(`${BOLD}Scripts to install:${RESET}`);
    console.log();
    for (const s of scripts) {
      console.log(`  ${CYAN}•${RESET} ${s.name}  ← ${s.filename}`);
    }
    console.log();
    console.log(`  Install to: ${BOLD}${installDir}/${RESET}`);
  }

  showInstallHeader(title: string): void {
    console.log(`${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${CYAN}║  ${title.padEnd(33)}║${RESET}`);
    console.log(`${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}`);
  }

  showInstalled(name: string, filename: string): void {
    console.log(`  ${GREEN}✓${RESET} ${name}  → ${filename}`);
  }

  showRemoved(name: string): void {
    console.log(`  ${RED}✗${RESET} Removed ${name}`);
  }

  showInstallSummary(
    count: number,
    installDir: string,
    names: string[],
  ): void {
    console.log();
    console.log(
      `${GREEN}${BOLD}✓ Installed ${count} script(s) to ${installDir}${RESET}`,
    );
    console.log();
    console.log(`${BOLD}Now you can run from anywhere:${RESET}`);
    for (const name of names) {
      console.log(`  ${CYAN}$${RESET} ${name}`);
    }
    console.log();
  }

  showPathHint(shellRc: string): void {
    console.log(
      `${YELLOW}⚠  Run: ${BOLD}source ${shellRc}${RESET}${YELLOW} to activate PATH${RESET}`,
    );
  }

  hideCursor(): void {
    process.stdout.write("\x1b[?25l");
  }

  showCursor(): void {
    process.stdout.write("\x1b[?25h");
  }

  readKey(): Promise<Key> {
    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.once("data", (data: Buffer) => {
        stdin.setRawMode(false);
        stdin.pause();

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

  renderMultiSelect(opts: {
    title: string;
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

    process.stdout.write(
      `${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}${CLEAR_LINE}\n`,
    );
    process.stdout.write(
      `${BOLD}${CYAN}║  ${opts.title}║${RESET}${CLEAR_LINE}\n`,
    );
    process.stdout.write(
      `${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}${CLEAR_LINE}\n`,
    );
    process.stdout.write(
      ` Selected: ${BOLD}${CYAN}${opts.selectedCount}${RESET} / ${opts.total}${CLEAR_LINE}\n`,
    );

    for (let j = 0; j < opts.total; j++) {
      const pointer = j === opts.cursor ? `${CYAN}➜${RESET} ` : "  ";
      const check = opts.selected[j] ? `${GREEN}●${RESET}` : "○";
      const nameColor = opts.selected[j] ? GREEN : "";
      process.stdout.write(
        `  ${pointer} ${check} ${nameColor}${opts.items[j]}${RESET}${CLEAR_LINE}\n`,
      );
    }

    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(
      `  ${CYAN}↑↓${RESET} Move  ${CYAN}Space${RESET} Toggle  ${CYAN}a${RESET} All  ${CYAN}Enter${RESET} Install  ${CYAN}q${RESET} Quit${CLEAR_LINE}\n`,
    );
    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(`${CLEAR_LINE}\n`);
  }
}
