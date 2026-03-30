#!/usr/bin/env bun
// force-quit.ts — Composition root (Hexagonal Architecture)
// Wires adapters → ports → core. No business logic here.

import { basename } from "path";
import { ForceQuitApp } from "./force-quit/core.ts";
import { MacOSSystemAdapter } from "./force-quit/macos-adapter.ts";
import { TerminalUIAdapter } from "./force-quit/terminal-adapter.ts";

// ─── Assemble ────────────────────────────────────────────────────────────────
const system = new MacOSSystemAdapter();
const ui = new TerminalUIAdapter();
const app = new ForceQuitApp(system, ui);

// ─── Route CLI arguments ─────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = basename(process.argv[1] ?? "force-quit");

  if (args.length === 0) {
    await app.interactivePicker();
    return;
  }

  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;

    if (arg === "-h" || arg === "--help") {
      ui.showUsage(cmd);
      process.exit(0);
    } else if (arg === "-l" || arg === "--list") {
      await app.listApps();
      process.exit(0);
    } else if (arg === "-p" || arg === "--pid") {
      const pid = args[i + 1];
      if (!pid) {
        ui.error("Option -p requires a PID argument.");
        process.exit(1);
      }
      await app.quitByPid(pid);
      process.exit(0);
    } else if (arg === "-i" || arg === "--interactive") {
      await app.multiSelectPicker();
      process.exit(0);
    } else if (arg.startsWith("-")) {
      ui.error(`Unknown option: ${arg}`);
      ui.showUsage(cmd);
      process.exit(1);
    } else {
      const appName = args.slice(i).join(" ");
      await app.quitByName(appName);
      process.exit(0);
    }
    i++;
  }
}

main();
