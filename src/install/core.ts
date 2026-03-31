// install/core.ts — Hexagonal Architecture: Domain logic
// Pure application logic. Depends ONLY on port interfaces.

import type { FileSystemPort, ScriptInfo, UIPort } from "./ports.ts";
import { multiSelect } from "../shared/multi-select.ts";

export class InstallerApp {
  constructor(
    private readonly fs: FileSystemPort,
    private readonly ui: UIPort,
    private readonly installDir: string,
  ) {}

  // ─── Commands ────────────────────────────────────────────────────────────

  async listScripts(): Promise<void> {
    const scripts = await this.fs.findScripts();
    if (scripts.length === 0) {
      this.ui.warn("No .sh scripts found.");
      return;
    }
    this.ui.showScriptList(scripts, this.installDir);
  }

  async installAll(): Promise<void> {
    this.ui.showInstallHeader("📦 Install All Scripts");

    const scripts = await this.fs.findScripts();
    if (scripts.length === 0) {
      this.ui.warn("No .sh scripts found.");
      return;
    }

    await this.doInstall(scripts);
  }

  async interactiveInstall(): Promise<void> {
    const scripts = await this.fs.findScripts();
    if (scripts.length === 0) {
      this.ui.warn("No .sh scripts found.");
      return;
    }

    const displayNames = scripts.map(
      (s) => `${s.name}  ← ${s.filename}`,
    );

    const selectedIndices = await multiSelect({
      title: "📦 Select Scripts to Install",
      items: displayNames,
      defaultSelected: true,
      pointer: "➜",
      confirmLabel: "Install",
    });

    if (selectedIndices.length === 0) {
      this.ui.warn("No scripts selected.");
      return;
    }

    const chosen = selectedIndices.map((i) => scripts[i]!);
    await this.doInstall(chosen);
  }

  async uninstall(): Promise<void> {
    this.ui.info("Uninstalling scripts from " + this.installDir + "...");

    const scripts = await this.fs.findScripts();
    let removed = 0;

    for (const script of scripts) {
      const target = `${this.installDir}/${script.name}`;
      if (await this.fs.remove(target)) {
        this.ui.showRemoved(script.name);
        removed++;
      }
    }

    if (removed === 0) {
      this.ui.warn("Nothing to remove.");
    } else {
      this.ui.success(`Removed ${removed} script(s).`);
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private async doInstall(scripts: ScriptInfo[]): Promise<void> {
    await this.setupBinDir();

    for (const script of scripts) {
      const target = `${this.installDir}/${script.name}`;
      await this.fs.remove(target);
      await this.fs.symlink(script.path, target);
      this.ui.showInstalled(script.name, script.filename);
    }

    const names = scripts.map((s) => s.name);
    this.ui.showInstallSummary(scripts.length, this.installDir, names);

    if (!this.fs.commandExists(names[0]!)) {
      const shellRc = this.fs.detectShellRc();
      this.ui.showPathHint(shellRc);
    }
  }

  private async setupBinDir(): Promise<void> {
    await this.fs.ensureDir(this.installDir);

    if (!this.fs.isInPath(this.installDir)) {
      const shellRc = this.fs.detectShellRc();
      this.ui.warn(`Adding ${this.installDir} to PATH in ${shellRc}...`);
      await this.fs.addToPath(shellRc, this.installDir);
      this.ui.success(
        `PATH updated. Run source ${shellRc} or open a new terminal.`,
      );
    }
  }
}
