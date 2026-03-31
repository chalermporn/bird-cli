// force-quit/adapters/terminal.ts — Hexagonal Architecture: UI adapter for terminal
// Implements UIPort using shared lib for colors and readline for prompts.

import { createInterface } from "readline";
import type { UIPort } from "../ports.ts";
import { RED, GREEN, YELLOW, CYAN, BOLD, RESET } from "../../shared/colors.ts";

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
