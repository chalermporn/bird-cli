#!/usr/bin/env bun
// install.ts — Composition root (Hexagonal Architecture)
// Wires adapters → ports → core. No business logic here.

import { basename, dirname } from "path";
import { InstallerApp } from "./install/core.ts";
import { LocalFSAdapter } from "./install/fs-adapter.ts";
import { TerminalUIAdapter } from "./install/terminal-adapter.ts";

// ─── Assemble ────────────────────────────────────────────────────────────────
const scriptDir = dirname(Bun.main);
const installDir = `${process.env.HOME}/bin`;
const fs = new LocalFSAdapter(scriptDir);
const ui = new TerminalUIAdapter();
const app = new InstallerApp(fs, ui, installDir);

// ─── Route CLI arguments ─────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = basename(process.argv[1] ?? "install");

  switch (args[0]) {
    case "-i":
      await app.interactiveInstall();
      break;
    case "--uninstall":
      await app.uninstall();
      break;
    case "--list":
      await app.listScripts();
      break;
    case "-h":
    case "--help":
      ui.showUsage(cmd);
      break;
    case undefined:
      await app.installAll();
      break;
    default:
      ui.error(`Unknown option: ${args[0]}`);
      ui.showUsage(cmd);
      process.exit(1);
  }
}

main();
