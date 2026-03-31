// install/ports.ts — Hexagonal Architecture: Port interfaces
// Ports define WHAT the application needs, not HOW it's done.

// ─── File System Port ────────────────────────────────────────────────────────
// Abstracts script discovery, symlinking, and PATH setup

export interface ScriptInfo {
  /** Absolute path to the script file */
  path: string;
  /** Display name (filename without .sh extension) */
  name: string;
  /** Original filename (e.g. "brewup.sh") */
  filename: string;
}

export interface FileSystemPort {
  /** Find all installable .sh scripts (excluding install.sh itself) */
  findScripts(): Promise<ScriptInfo[]>;

  /** Ensure the install directory exists */
  ensureDir(dir: string): Promise<void>;

  /** Check if install dir is in PATH */
  isInPath(dir: string): boolean;

  /** Append PATH export to shell RC file */
  addToPath(shellRc: string, installDir: string): Promise<void>;

  /** Create a symlink: target → script, make script executable */
  symlink(scriptPath: string, targetPath: string): Promise<void>;

  /** Remove a file or symlink if it exists */
  remove(path: string): Promise<boolean>;

  /** Detect the user's shell RC file path */
  detectShellRc(): string;

  /** Check if a command is available in PATH */
  commandExists(name: string): boolean;
}

// ─── UI Port ─────────────────────────────────────────────────────────────────
// Abstracts all terminal display and input
// Multi-select TUI is provided by lib/multi-select.ts

export interface UIPort {
  info(msg: string): void;
  success(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;

  /** Show usage/help text */
  showUsage(cmd: string): void;

  /** Show list of scripts that would be installed */
  showScriptList(scripts: ScriptInfo[], installDir: string): void;

  /** Show install header */
  showInstallHeader(title: string): void;

  /** Show installed script result */
  showInstalled(name: string, filename: string): void;

  /** Show removed script result */
  showRemoved(name: string): void;

  /** Show install summary */
  showInstallSummary(count: number, installDir: string, names: string[]): void;

  /** Show PATH activation hint */
  showPathHint(shellRc: string): void;
}
