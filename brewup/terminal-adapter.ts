// brewup/terminal-adapter.ts — Hexagonal Architecture: Terminal UI adapter
// Implements UIPort using ANSI escape codes for colored output

import type { PackageInfo, UIPort } from "./ports.ts";
import { GREEN, BLUE, YELLOW, RED, BOLD, RESET } from "../lib/colors.ts";

const NC = RESET;

export class TerminalUIAdapter implements UIPort {
  showTitle(): void {
    console.log(`${BLUE}🍺 Homebrew Update${NC}`);
    console.log();
  }

  showInstalled(formulaeCount: number, caskCount: number): void {
    console.log(
      `${BLUE}📋 Installed:${NC} ${formulaeCount} formulae, ${caskCount} casks`,
    );
  }

  showOutdated(formulae: PackageInfo[], casks: PackageInfo[]): void {
    const total = formulae.length + casks.length;
    console.log(`${YELLOW}📦 Outdated: ${total}${NC}`);
    if (formulae.length > 0) {
      console.log(
        `   Formulae: ${formulae.map((f) => f.name).join(" ")}`,
      );
    }
    if (casks.length > 0) {
      console.log(`   Casks:    ${casks.map((c) => c.name).join(" ")}`);
    }
    console.log();
  }

  showUpToDate(): void {
    console.log(`${GREEN}✓ Everything is up to date${NC}`);
    console.log();
  }

  showSection(icon: string, label: string, count: number): void {
    console.log();
    console.log(`${BLUE}${icon} ${label} (${count})${NC}`);
  }

  showStep(stepNum: number, total: number, label: string, ok: boolean): void {
    const prefix = `${YELLOW}[${stepNum}/${total}]${NC}`;
    console.log(`${prefix} ${label}`);
    if (ok) {
      console.log(`      ${GREEN}✓${NC} Done`);
    } else {
      console.log(`      ${RED}✗${NC} Failed`);
    }
  }

  showSummary(ok: number, fail: number): void {
    console.log();
    if (fail === 0) {
      console.log(`${GREEN}✓ All done! (${ok} steps completed)${NC}`);
    } else {
      console.log(
        `${YELLOW}⚠ Done with issues: ${ok} ok, ${RED}${fail} failed${NC}`,
      );
    }
  }
}
