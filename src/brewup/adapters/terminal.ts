// brewup/adapters/terminal.ts — Hexagonal Architecture: Terminal UI adapter
// Implements UIPort using ANSI escape codes for colored output

import type { PackageInfo, UIPort } from "../ports.ts";
import { ok, err, warn, info, dim, heading, icons } from "../../shared/colors.ts";

export class TerminalUIAdapter implements UIPort {
  showTitle(): void {
    console.log(heading("🍺 Homebrew Update"));
    console.log();
  }

  showInstalled(formulaeCount: number, caskCount: number): void {
    console.log(
      `${info("📋 Installed:")} ${formulaeCount} formulae, ${caskCount} casks`,
    );
  }

  showOutdated(formulae: PackageInfo[], casks: PackageInfo[]): void {
    const total = formulae.length + casks.length;
    console.log(warn(`📦 Outdated: ${total}`));
    if (formulae.length > 0) {
      console.log(
        `   Formulae: ${dim(formulae.map((f) => f.name).join(" "))}`,
      );
    }
    if (casks.length > 0) {
      console.log(`   Casks:    ${dim(casks.map((c) => c.name).join(" "))}`);
    }
    console.log();
  }

  showUpToDate(): void {
    console.log(ok(`${icons.ok} Everything is up to date`));
    console.log();
  }

  showSection(icon: string, label: string, count: number): void {
    console.log();
    console.log(info(`${icon} ${label} ${dim(`(${count})`)}`));
  }

  showStep(stepNum: number, total: number, label: string, isOk: boolean): void {
    const prefix = warn(`[${stepNum}/${total}]`);
    console.log(`${prefix} ${label}`);
    if (isOk) {
      console.log(`      ${ok(icons.ok)} ${dim("Done")}`);
    } else {
      console.log(`      ${err(icons.fail)} ${dim("Failed")}`);
    }
  }

  showSummary(okCount: number, fail: number): void {
    console.log();
    if (fail === 0) {
      console.log(ok(`${icons.ok} All done! ${dim(`(${okCount} steps completed)`)}`));
    } else {
      console.log(
        `${warn(`${icons.warn} Done with issues:`)} ${ok(`${okCount} ok`)}${dim(",")} ${err(`${fail} failed`)}`,
      );
    }
  }
}
