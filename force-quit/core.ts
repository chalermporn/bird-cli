// force-quit/core.ts — Hexagonal Architecture: Domain logic
// Pure application logic. Depends ONLY on port interfaces — no Bun.$, no ANSI, no OS calls.

import type { SystemPort, UIPort } from "./ports.ts";
import { multiSelect } from "../lib/multi-select.ts";

export class ForceQuitApp {
  constructor(
    private readonly system: SystemPort,
    private readonly ui: UIPort,
  ) {}

  // ─── Commands ────────────────────────────────────────────────────────────

  async quitByName(appName: string): Promise<void> {
    if (!(await this.system.isRunning(appName))) {
      this.ui.error(`'${appName}' is not running.`);
      process.exit(1);
    }

    this.ui.warn(`⚡ Force quitting '${appName}'...`);
    const result = await this.system.forceQuitByName(appName);

    if (result.ok) {
      const label = result.method === "graceful" ? "quit gracefully" : "force killed";
      this.ui.success(`'${appName}' ${label}.`);
    } else {
      this.ui.error(`Failed to kill '${appName}'. ${result.reason}`);
      process.exit(1);
    }
  }

  async quitByPid(pidStr: string): Promise<void> {
    const pid = Number(pidStr);
    if (!Number.isInteger(pid) || pid <= 0) {
      this.ui.error(`Invalid PID: '${pidStr}'`);
      process.exit(1);
    }

    if (!this.system.pidExists(pid)) {
      this.ui.error(`No process with PID ${pid}.`);
      process.exit(1);
    }

    const procName = await this.system.getProcessName(pid);
    this.ui.warn(`⚡ Force killing PID ${pid} (${procName})...`);

    const result = await this.system.forceQuitByPid(pid);
    if (result.ok) {
      this.ui.success(`PID ${pid} killed.`);
    } else {
      this.ui.error(result.reason);
      process.exit(1);
    }
  }

  async listApps(): Promise<void> {
    const apps = await this.system.listApps();
    this.ui.showBulletList("Running GUI Applications:", apps);
  }

  // ─── Interactive Mode (single select) ───────────────────────────────────

  async interactivePicker(): Promise<void> {
    this.ui.showHeader("Force Quit Application");

    const apps = await this.system.listApps();
    if (apps.length === 0) {
      this.ui.error("No GUI applications found.");
      process.exit(1);
    }

    this.ui.showNumberedList(apps);

    const choice = await this.ui.prompt(`Select app to force quit [0-${apps.length}]: `);
    const num = Number(choice);

    if (!choice || isNaN(num) || num === 0) {
      this.ui.warn("Cancelled.");
      process.exit(0);
    }
    if (num < 1 || num > apps.length) {
      this.ui.error("Invalid selection.");
      process.exit(1);
    }

    const selected = apps[num - 1]!;
    const confirm = await this.ui.prompt(`Force quit '${selected}'? [y/N]: `);
    if (confirm.toLowerCase() === "y") {
      await this.quitByName(selected);
    } else {
      this.ui.warn("Cancelled.");
    }
  }

  // ─── Multi-select Mode (TUI) ───────────────────────────────────────────

  async multiSelectPicker(): Promise<void> {
    const apps = await this.system.listApps();
    if (apps.length === 0) {
      this.ui.error("No GUI applications found.");
      process.exit(1);
    }

    const selectedIndices = await multiSelect({
      title: "⚡ Force Quit — Multi Select",
      items: apps,
    });

    if (selectedIndices.length === 0) {
      this.ui.warn("No apps selected.");
      process.exit(0);
    }

    const toKill = selectedIndices.map((i) => apps[i]!);
    this.ui.showBulletList("Will force quit:", toKill);
    console.log();

    const confirm = await this.ui.prompt("Confirm? [y/N]: ");
    if (confirm.toLowerCase() === "y") {
      for (const app of toKill) {
        await this.quitByName(app);
      }
    } else {
      this.ui.warn("Cancelled.");
    }
    process.exit(0);
  }
}
