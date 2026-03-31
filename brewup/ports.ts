// brewup/ports.ts — Hexagonal Architecture: Port interfaces
// Ports define WHAT the application needs, not HOW it's done.

// ─── Package Manager Port ────────────────────────────────────────────────────
// Abstracts all Homebrew operations

export interface PackageInfo {
  name: string;
  installed: string;
  latest?: string;
}

export interface PackageManagerPort {
  /** Update Homebrew index */
  update(): Promise<boolean>;

  /** List all installed formula names */
  listFormulae(): Promise<string[]>;

  /** List all installed cask names */
  listCasks(): Promise<string[]>;

  /** Get version info for all installed packages */
  getVersions(): Promise<Map<string, string>>;

  /** Get outdated packages with target versions */
  getOutdated(type: "formula" | "cask"): Promise<PackageInfo[]>;

  /** Upgrade a single formula */
  upgradeFormula(name: string): Promise<boolean>;

  /** Upgrade a single cask (greedy) */
  upgradeCask(name: string): Promise<boolean>;

  /** Run cleanup */
  cleanup(): Promise<boolean>;

  /** Upgrade Mac App Store apps (returns false if mas not available) */
  upgradeMas(): Promise<boolean | null>;

  /** Check if mas CLI is installed */
  hasMas(): boolean;
}

// ─── Logger Port ─────────────────────────────────────────────────────────────
// Abstracts log file operations

export interface LoggerPort {
  /** Rotate log file, keeping only entries within retention days */
  rotate(retentionDays: number): Promise<void>;

  /** Write a line to the log */
  log(line: string): Promise<void>;

  /** Write session header (date separator) */
  writeHeader(): Promise<void>;

  /** Write session footer with stats */
  writeFooter(ok: number, fail: number): Promise<void>;
}

// ─── UI Port ─────────────────────────────────────────────────────────────────
// Abstracts all terminal display

export interface StepResult {
  label: string;
  ok: boolean;
}

export interface UIPort {
  /** Show the main title banner */
  showTitle(): void;

  /** Show summary of installed packages */
  showInstalled(formulaeCount: number, caskCount: number): void;

  /** Show outdated packages summary */
  showOutdated(formulae: PackageInfo[], casks: PackageInfo[]): void;

  /** Show "everything up to date" */
  showUpToDate(): void;

  /** Show a section header (e.g. "Formulae (42)") */
  showSection(icon: string, label: string, count: number): void;

  /** Show step progress and result */
  showStep(stepNum: number, total: number, label: string, ok: boolean): void;

  /** Show final summary */
  showSummary(ok: number, fail: number): void;
}
