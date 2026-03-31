// force-quit/ports.ts — Hexagonal Architecture: Port interfaces
// Ports define WHAT the application needs, not HOW it's done.

// ─── System Port ─────────────────────────────────────────────────────────────
// Abstracts all OS-level operations (process listing, killing, detection)

export interface SystemPort {
  /** List running GUI application names */
  listApps(): Promise<string[]>;

  /** Check if a process is running by name */
  isRunning(name: string): Promise<boolean>;

  /** Attempt graceful quit, then force kill by app name. Returns success. */
  forceQuitByName(appName: string): Promise<ForceQuitResult>;

  /** Force kill by PID. Returns success. */
  forceQuitByPid(pid: number): Promise<ForceQuitResult>;

  /** Get process name for a given PID */
  getProcessName(pid: number): Promise<string>;

  /** Check if a PID exists */
  pidExists(pid: number): boolean;
}

export type ForceQuitResult =
  | { ok: true; method: "graceful" | "killall" | "pkill" | "signal" }
  | { ok: false; reason: string };

// ─── UI Port ─────────────────────────────────────────────────────────────────
// Abstracts all user interaction (display, input)
// Multi-select TUI is provided by lib/multi-select.ts

export interface UIPort {
  /** Show a styled message */
  info(msg: string): void;
  success(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;

  /** Show the app header banner */
  showHeader(title: string): void;

  /** Display a numbered list and return it */
  showNumberedList(items: string[]): void;

  /** Prompt user for text input */
  prompt(question: string): Promise<string>;

  /** Show usage/help text */
  showUsage(cmd: string): void;

  /** Show a bulleted list of app names */
  showBulletList(title: string, items: string[]): void;
}
