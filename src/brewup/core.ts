// brewup/core.ts — Hexagonal Architecture: Domain logic
// Pure application logic. Depends ONLY on port interfaces.

import type { LoggerPort, PackageManagerPort, UIPort } from "./ports.ts";

export class BrewUpApp {
  constructor(
    private readonly pm: PackageManagerPort,
    private readonly ui: UIPort,
    private readonly logger: LoggerPort,
  ) {}

  async run(): Promise<void> {
    // ─── Log rotation & header ─────────────────────────────────────────────
    await this.logger.rotate(7);
    await this.logger.writeHeader();

    this.ui.showTitle();

    // ─── Discover installed packages ───────────────────────────────────────
    const formulae = await this.pm.listFormulae();
    const casks = await this.pm.listCasks();
    const hasMas = this.pm.hasMas();

    this.ui.showInstalled(formulae.length, casks.length);

    // ─── Check outdated ────────────────────────────────────────────────────
    const outdatedFormulae = await this.pm.getOutdated("formula");
    const outdatedCasks = await this.pm.getOutdated("cask");

    if (outdatedFormulae.length + outdatedCasks.length > 0) {
      this.ui.showOutdated(outdatedFormulae, outdatedCasks);
    } else {
      this.ui.showUpToDate();
    }

    await this.logger.log(
      `Installed formulae (${formulae.length}): ${formulae.join(" ")}`,
    );
    await this.logger.log(
      `Installed casks (${casks.length}): ${casks.join(" ")}`,
    );

    // ─── Calculate total steps ─────────────────────────────────────────────
    const masStep = hasMas ? 1 : 0;
    const total = 1 + formulae.length + casks.length + 1 + masStep;
    let step = 1;
    let ok = 0;
    let fail = 0;

    const runStep = async (
      label: string,
      fn: () => Promise<boolean>,
    ): Promise<void> => {
      await this.logger.log(`>> ${label}`);
      const success = await fn();
      this.ui.showStep(step, total, label, success);
      if (success) ok++;
      else {
        fail++;
        await this.logger.log(`!! FAILED: ${label}`);
      }
      step++;
    };

    // ─── Step 1: Update Homebrew ───────────────────────────────────────────
    await runStep("Updating Homebrew", () => this.pm.update());

    // ─── Upgrade formulae ──────────────────────────────────────────────────
    if (formulae.length > 0) {
      this.ui.showSection("🔧", "Formulae", formulae.length);
      const versions = await this.pm.getVersions();
      for (const name of formulae) {
        const label = this.buildLabel(name, versions, outdatedFormulae);
        await runStep(label, () => this.pm.upgradeFormula(name));
      }
    }

    // ─── Upgrade casks ─────────────────────────────────────────────────────
    if (casks.length > 0) {
      this.ui.showSection("📦", "Casks", casks.length);
      const versions = await this.pm.getVersions();
      for (const name of casks) {
        const label = this.buildLabel(name, versions, outdatedCasks);
        await runStep(label, () => this.pm.upgradeCask(name));
      }
    }

    // ─── Cleanup ───────────────────────────────────────────────────────────
    await runStep("Cleaning up", () => this.pm.cleanup());

    // ─── Mac App Store ─────────────────────────────────────────────────────
    if (hasMas) {
      await runStep("Upgrading Mac App Store apps", async () => {
        const result = await this.pm.upgradeMas();
        return result === true;
      });
    }

    // ─── Summary ───────────────────────────────────────────────────────────
    this.ui.showSummary(ok, fail);
    await this.logger.writeFooter(ok, fail);
  }

  private buildLabel(
    name: string,
    versions: Map<string, string>,
    outdated: { name: string; installed: string; latest?: string }[],
  ): string {
    const installed = versions.get(name);
    const outdatedInfo = outdated.find((o) => o.name === name);
    if (outdatedInfo?.latest) {
      return `${name} (${outdatedInfo.installed} → ${outdatedInfo.latest})`;
    }
    if (installed) {
      return `${name} (${installed})`;
    }
    return name;
  }
}
