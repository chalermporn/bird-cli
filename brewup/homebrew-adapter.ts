// brewup/homebrew-adapter.ts — Hexagonal Architecture: Homebrew adapter
// Implements PackageManagerPort using brew CLI via Bun.$

import { $ } from "bun";
import type { PackageInfo, PackageManagerPort } from "./ports.ts";

const BREW = "/opt/homebrew/bin/brew";

export class HomebrewAdapter implements PackageManagerPort {
  async update(): Promise<boolean> {
    try {
      await $`${BREW} update`.quiet();
      return true;
    } catch {
      return false;
    }
  }

  async listFormulae(): Promise<string[]> {
    try {
      const out = await $`${BREW} list --formula`.text();
      return out
        .trim()
        .split("\n")
        .filter((l) => l.length > 0);
    } catch {
      return [];
    }
  }

  async listCasks(): Promise<string[]> {
    try {
      const out = await $`${BREW} list --cask`.text();
      return out
        .trim()
        .split("\n")
        .filter((l) => l.length > 0);
    } catch {
      return [];
    }
  }

  async getVersions(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    try {
      const formulaOut = await $`${BREW} list --versions --formula`.text();
      const caskOut = await $`${BREW} list --versions --cask`.text();
      for (const line of `${formulaOut}\n${caskOut}`.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          map.set(parts[0]!, parts[parts.length - 1]!);
        }
      }
    } catch {
      // ignore
    }
    return map;
  }

  async getOutdated(type: "formula" | "cask"): Promise<PackageInfo[]> {
    const results: PackageInfo[] = [];
    try {
      const flag = type === "formula" ? "--formula" : "--cask --greedy";
      const out = await $`${BREW} outdated ${flag} --verbose`.text();
      for (const line of out.trim().split("\n")) {
        if (!line.trim()) continue;
        const name = line.split(/\s/)[0]!;
        const parts = line.trim().split(/\s+/);
        const latest = parts[parts.length - 1] ?? "";
        // Extract installed version from parenthesized section
        const match = line.match(/\((.+?)\)/);
        const installed = match?.[1] ?? "";
        results.push({ name, installed, latest });
      }
    } catch {
      // no outdated packages
    }
    return results;
  }

  async upgradeFormula(name: string): Promise<boolean> {
    try {
      await $`${BREW} upgrade --formula ${name}`.quiet();
      return true;
    } catch {
      return false;
    }
  }

  async upgradeCask(name: string): Promise<boolean> {
    try {
      await $`${BREW} upgrade --cask --greedy ${name}`.quiet();
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<boolean> {
    try {
      await $`${BREW} cleanup`.quiet();
      return true;
    } catch {
      return false;
    }
  }

  hasMas(): boolean {
    try {
      Bun.spawnSync(["which", "mas"]);
      return Bun.spawnSync(["which", "mas"]).success;
    } catch {
      return false;
    }
  }

  async upgradeMas(): Promise<boolean | null> {
    if (!this.hasMas()) return null;
    try {
      await $`mas upgrade`.quiet();
      return true;
    } catch {
      return false;
    }
  }
}
