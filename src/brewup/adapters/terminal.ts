// brewup/adapters/terminal.ts — Hexagonal Architecture: Terminal UI adapter
// Implements UIPort using ANSI escape codes for colored output

import type { PackageInfo, UIPort } from "../ports.ts";
import { pc } from "../../shared/colors.ts";

export class TerminalUIAdapter implements UIPort {
  showTitle(): void {
    console.log(pc.magenta("🍺 Homebrew Update"));
    console.log();
  }

  showInstalled(formulaeCount: number, caskCount: number): void {
    console.log(
      `${pc.magenta("📋 Installed:")} ${formulaeCount} formulae, ${caskCount} casks`,
    );
  }

  showOutdated(formulae: PackageInfo[], casks: PackageInfo[]): void {
    const total = formulae.length + casks.length;
    console.log(pc.yellow(`📦 Outdated: ${total}`));
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
    console.log(pc.green("✓ Everything is up to date"));
    console.log();
  }

  showSection(icon: string, label: string, count: number): void {
    console.log();
    console.log(pc.magenta(`${icon} ${label} (${count})`));
  }

  showStep(stepNum: number, total: number, label: string, ok: boolean): void {
    const prefix = pc.yellow(`[${stepNum}/${total}]`);
    console.log(`${prefix} ${label}`);
    if (ok) {
      console.log(`      ${pc.green("✓")} Done`);
    } else {
      console.log(`      ${pc.red("✗")} Failed`);
    }
  }

  showSummary(ok: number, fail: number): void {
    console.log();
    if (fail === 0) {
      console.log(pc.green(`✓ All done! (${ok} steps completed)`));
    } else {
      console.log(
        `${pc.yellow(`⚠ Done with issues: ${ok} ok,`)} ${pc.red(`${fail} failed`)}`,
      );
    }
  }
}
