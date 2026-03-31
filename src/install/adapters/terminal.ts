// install/adapters/terminal.ts — Hexagonal Architecture: Terminal UI adapter
// Implements UIPort using shared lib for colors.

import type { ScriptInfo, UIPort } from "../ports.ts";
import { ok, err, warn, dim, heading, accent, accentBold, icons } from "../../shared/colors.ts";

export class TerminalUIAdapter implements UIPort {
  info(msg: string): void {
    console.log(heading(msg));
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

  showUsage(cmd: string): void {
    console.log(heading("USAGE"));
    console.log(`  ${accent(cmd)}              ${dim('Install all scripts to ~/bin')}`);
    console.log(`  ${accent(cmd)} -i           ${dim('Interactive select — pick scripts to install')}`);
    console.log(`  ${accent(cmd)} --uninstall  ${dim('Remove installed scripts')}`);
    console.log(`  ${accent(cmd)} --list       ${dim('List what would be installed')}`);
    console.log(`  ${accent(cmd)} -h           ${dim('Show this help')}`);
  }

  showScriptList(scripts: ScriptInfo[], installDir: string): void {
    console.log(heading("Scripts to install:"));
    console.log();
    for (const s of scripts) {
      console.log(`  ${accent(icons.bullet)} ${s.name}  ${dim(icons.arrowL)} ${dim(s.filename)}`);
    }
    console.log();
    console.log(`  ${dim('Install to:')} ${heading(`${installDir}/`)}`);
  }

  showInstallHeader(title: string): void {
    const w = 38;
    console.log(accentBold(`┌${'─'.repeat(w)}┐`));
    console.log(accentBold(`│`) + `  ${heading(title.padEnd(w - 2))}` + accentBold(`│`));
    console.log(accentBold(`└${'─'.repeat(w)}┘`));
  }

  showInstalled(name: string, filename: string): void {
    console.log(`  ${ok(icons.ok)} ${name}  ${dim(icons.arrow)} ${dim(filename)}`);
  }

  showRemoved(name: string): void {
    console.log(`  ${err(icons.fail)} ${dim('Removed')} ${name}`);
  }

  showInstallSummary(
    count: number,
    installDir: string,
    names: string[],
  ): void {
    console.log();
    console.log(
      ok(`${icons.ok} Installed ${count} script(s) to ${installDir}`),
    );
    console.log();
    console.log(heading("Now you can run from anywhere:"));
    for (const name of names) {
      console.log(`  ${dim('$')} ${accent(name)}`);
    }
    console.log();
  }

  showPathHint(shellRc: string): void {
    console.log(
      warn(`${icons.warn}  Run: ${heading(`source ${shellRc}`)} to activate PATH`),
    );
  }
}
