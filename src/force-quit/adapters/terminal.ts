// force-quit/adapters/terminal.ts — Hexagonal Architecture: UI adapter for terminal
// Implements UIPort using shared lib for colors and readline for prompts.

import { createInterface } from "readline";
import type { UIPort } from "../ports.ts";
import { ok, err, warn, dim, heading, accent, accentBold, icons } from "../../shared/colors.ts";

export class TerminalUIAdapter implements UIPort {
  info(msg: string): void {
    console.log(msg);
  }

  success(msg: string): void {
    console.log(ok(`${icons.ok} ${msg}`));
  }

  warn(msg: string): void {
    console.log(warn(`${icons.warn} ${msg}`));
  }

  error(msg: string): void {
    console.log(err(`${icons.fail} ${msg}`));
  }

  showHeader(title: string): void {
    const w = 38;
    console.log(accentBold(`┌${'─'.repeat(w)}┐`));
    console.log(accentBold(`│`) + `  ⚡ ${heading(title.padEnd(w - 5))}` + accentBold(`│`));
    console.log(accentBold(`└${'─'.repeat(w)}┘`));
    console.log();
  }

  showNumberedList(items: string[]): void {
    items.forEach((item, i) => {
      const num = String(i + 1).padStart(2);
      console.log(`  ${accent(`${num})`)} ${item}`);
    });
    console.log();
    console.log(`  ${dim(` 0)`)} ${dim('Cancel')}`);
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
    console.log(heading("USAGE"));
    console.log(`  ${accent(cmd)}              ${dim('Interactive mode — list & pick app to kill')}`);
    console.log(`  ${accent(cmd)} -i           ${dim('Multi-select mode — toggle multiple apps')}`);
    console.log(`  ${accent(cmd)} <app_name>   ${dim('Kill app by name (e.g. "Safari")')}`);
    console.log(`  ${accent(cmd)} -p <PID>     ${dim('Kill by process ID')}`);
    console.log(`  ${accent(cmd)} -l           ${dim('List running GUI applications')}`);
    console.log(`  ${accent(cmd)} -h           ${dim('Show this help')}`);
    console.log();
    console.log(heading("EXAMPLES"));
    console.log(`  ${dim('$')} ${cmd} Safari`);
    console.log(`  ${dim('$')} ${cmd} -p 12345`);
    console.log(`  ${dim('$')} ${cmd}              ${dim('interactive picker')}`);
  }

  showBulletList(title: string, items: string[]): void {
    console.log(heading(title));
    for (const item of items) {
      console.log(`  ${accent(icons.bullet)} ${item}`);
    }
  }
}
