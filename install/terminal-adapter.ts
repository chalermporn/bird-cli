// install/terminal-adapter.ts — Hexagonal Architecture: Terminal UI adapter
// Implements UIPort using shared lib for colors.

import type { ScriptInfo, UIPort } from "./ports.ts";
import { RED, GREEN, YELLOW, CYAN, BOLD, RESET } from "../lib/colors.ts";

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
}
