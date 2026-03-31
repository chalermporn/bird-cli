// install/fs-adapter.ts — Hexagonal Architecture: File system adapter
// Implements FileSystemPort using Bun.$ and Bun.file

import { $ } from "bun";
import { basename, dirname, resolve } from "path";
import { readdir, symlink as fsSymlink, mkdir } from "node:fs/promises";
import type { FileSystemPort, ScriptInfo } from "./ports.ts";

export class LocalFSAdapter implements FileSystemPort {
  constructor(private readonly scriptDir: string) {}

  async findScripts(): Promise<ScriptInfo[]> {
    const selfName = "install.sh";
    const entries = await readdir(this.scriptDir);
    return entries
      .filter((f) => f.endsWith(".sh") && f !== selfName)
      .sort()
      .map((filename) => ({
        path: resolve(this.scriptDir, filename),
        name: basename(filename, ".sh"),
        filename,
      }));
  }

  async ensureDir(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  }

  isInPath(dir: string): boolean {
    return (process.env.PATH ?? "").split(":").includes(dir);
  }

  async addToPath(shellRc: string, installDir: string): Promise<void> {
    const file = Bun.file(shellRc);
    const existing = (await file.exists()) ? await file.text() : "";
    const addition = `\n# Added by script installer\nexport PATH="$HOME/bin:$PATH"\n`;
    await Bun.write(shellRc, existing + addition);
  }

  async symlink(scriptPath: string, targetPath: string): Promise<void> {
    await $`chmod +x ${scriptPath}`.quiet();
    try {
      await fsSymlink(scriptPath, targetPath);
    } catch {
      // If symlink exists, remove and retry
      await $`rm -f ${targetPath}`.quiet();
      await fsSymlink(scriptPath, targetPath);
    }
  }

  async remove(path: string): Promise<boolean> {
    const file = Bun.file(path);
    if (await file.exists()) {
      await $`rm -f ${path}`.quiet();
      return true;
    }
    return false;
  }

  detectShellRc(): string {
    const shell = basename(process.env.SHELL ?? "zsh");
    switch (shell) {
      case "zsh":
        return `${process.env.HOME}/.zshrc`;
      case "bash":
        return `${process.env.HOME}/.bashrc`;
      default:
        return `${process.env.HOME}/.profile`;
    }
  }

  commandExists(name: string): boolean {
    return Bun.spawnSync(["which", name]).success;
  }
}
