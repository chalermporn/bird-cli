// install/adapters/terminal.ts — Hexagonal Architecture: Terminal UI adapter
// Implements UIPort using shared lib for colors.

import type { ScriptInfo, UIPort } from "../ports.ts";
import { pc } from "../../shared/colors.ts";

export class TerminalUIAdapter implements UIPort {
  info(msg: string): void {
    console.log(pc.bold(msg));
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

  showUsage(cmd: string): void {
    console.log(pc.bold("Usage:"));
    console.log(`  ${cmd}              ${pc.dim("# Install all scripts to ~/bin")}`);
    console.log(`  ${cmd} -i           ${pc.dim("# Interactive select — pick scripts to install")}`);
    console.log(`  ${cmd} --uninstall  ${pc.dim("# Remove installed scripts")}`);
    console.log(`  ${cmd} --list       ${pc.dim("# List what would be installed")}`);
    console.log(`  ${cmd} -h           ${pc.dim("# Show this help")}`);
  }

  showScriptList(scripts: ScriptInfo[], installDir: string): void {
    console.log(pc.bold("Scripts to install:"));
    console.log();
    for (const s of scripts) {
      console.log(`  ${pc.cyan("•")} ${s.name}  ${pc.dim("←")} ${pc.dim(s.filename)}`);
    }
    console.log();
    console.log(`  Install to: ${pc.bold(`${installDir}/`)}`);
  }

  showInstallHeader(title: string): void {
    console.log(pc.bold(pc.cyan("╔══════════════════════════════════════╗")));
    console.log(pc.bold(pc.cyan(`║  ${title.padEnd(33)}║`)));
    console.log(pc.bold(pc.cyan("╚══════════════════════════════════════╝")));
  }

  showInstalled(name: string, filename: string): void {
    console.log(`  ${pc.green("✓")} ${name}  ${pc.dim("→")} ${pc.dim(filename)}`);
  }

  showRemoved(name: string): void {
    console.log(`  ${pc.red("✗")} Removed ${name}`);
  }

  showInstallSummary(
    count: number,
    installDir: string,
    names: string[],
  ): void {
    console.log();
    console.log(
      pc.bold(pc.green(`✓ Installed ${count} script(s) to ${installDir}`)),
    );
    console.log();
    console.log(pc.bold("Now you can run from anywhere:"));
    for (const name of names) {
      console.log(`  ${pc.cyan("$")} ${name}`);
    }
    console.log();
  }

  showPathHint(shellRc: string): void {
    console.log(
      pc.yellow(`⚠  Run: ${pc.bold(`source ${shellRc}`)} to activate PATH`),
    );
  }
}
