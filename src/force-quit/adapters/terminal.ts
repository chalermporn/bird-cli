// force-quit/adapters/terminal.ts — Hexagonal Architecture: UI adapter for terminal
// Implements UIPort using shared lib for colors and readline for prompts.

import { createInterface } from "readline";
import type { UIPort } from "../ports.ts";
import { pc } from "../../shared/colors.ts";

export class TerminalUIAdapter implements UIPort {
  info(msg: string): void {
    console.log(msg);
  }

  success(msg: string): void {
    console.log(pc.green(`✓ ${msg}`));
  }

  warn(msg: string): void {
    console.log(pc.yellow(msg));
  }

  error(msg: string): void {
    console.log(pc.red(`✗ ${msg}`));
  }

  showHeader(title: string): void {
    console.log(pc.bold(pc.cyan("╔══════════════════════════════════════╗")));
    console.log(pc.bold(pc.cyan(`║  ⚡ ${title.padEnd(33)}║`)));
    console.log(pc.bold(pc.cyan("╚══════════════════════════════════════╝")));
    console.log();
  }

  showNumberedList(items: string[]): void {
    items.forEach((item, i) => {
      const num = String(i + 1).padStart(2);
      console.log(`  ${pc.cyan(`${num})`)} ${item}`);
    });
    console.log();
    console.log(`  ${pc.cyan(" 0)")} Cancel`);
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
    console.log(pc.bold("Usage:"));
    console.log(`  ${cmd}              ${pc.dim("# Interactive mode — list & pick app to kill")}`);
    console.log(`  ${cmd} -i           ${pc.dim("# Multi-select mode — toggle multiple apps to kill")}`);
    console.log(`  ${cmd} <app_name>   ${pc.dim("# Kill app by name (e.g. \"Safari\", \"Finder\")")}`);
    console.log(`  ${cmd} -p <PID>     ${pc.dim("# Kill by process ID")}`);
    console.log(`  ${cmd} -l           ${pc.dim("# List running GUI applications")}`);
    console.log(`  ${cmd} -h           ${pc.dim("# Show this help")}`);
    console.log();
    console.log(pc.bold("Examples:"));
    console.log(`  ${cmd} Safari`);
    console.log(`  ${cmd} -p 12345`);
    console.log(`  ${cmd}              ${pc.dim("# interactive picker")}`);
  }

  showBulletList(title: string, items: string[]): void {
    console.log(pc.bold(title));
    for (const item of items) {
      console.log(`  ${pc.cyan("•")} ${item}`);
    }
  }
}
