// force-quit/macos-adapter.ts — Hexagonal Architecture: System adapter for macOS
// Implements SystemPort using osascript, killall, pkill, and Bun.$ shell

import { $ } from "bun";
import type { ForceQuitResult, SystemPort } from "./ports.ts";

export class MacOSSystemAdapter implements SystemPort {
  async listApps(): Promise<string[]> {
    try {
      const result =
        await $`osascript -e 'tell application "System Events" to set appList to name of every process whose background only is false' -e 'set AppleScript'"'"'s text item delimiters to linefeed' -e 'return appList as text'`
          .text();
      return result
        .trim()
        .split("\n")
        .filter((a) => a.length > 0);
    } catch {
      return [];
    }
  }

  async isRunning(name: string): Promise<boolean> {
    try {
      await $`pgrep -xiq ${name}`.quiet();
      return true;
    } catch {
      try {
        await $`pgrep -if ${name}`.quiet();
        return true;
      } catch {
        return false;
      }
    }
  }

  async forceQuitByName(appName: string): Promise<ForceQuitResult> {
    // Try graceful quit via AppleScript
    try {
      await $`osascript -e ${"tell application \"" + appName + "\" to quit"}`.quiet();
      await Bun.sleep(1000);
      if (!(await this.isRunning(appName))) {
        return { ok: true, method: "graceful" };
      }
    } catch {
      // graceful quit failed, continue to force kill
    }

    // Force kill with killall
    try {
      await $`killall -9 ${appName}`.quiet();
      return { ok: true, method: "killall" };
    } catch {
      // killall failed
    }

    // Try case-insensitive pkill as fallback
    try {
      await $`pkill -9 -if ${appName}`.quiet();
      return { ok: true, method: "pkill" };
    } catch {
      return { ok: false, reason: "All kill methods failed. Try with sudo or check the name." };
    }
  }

  async forceQuitByPid(pid: number): Promise<ForceQuitResult> {
    try {
      process.kill(pid, 9);
      return { ok: true, method: "signal" };
    } catch {
      return { ok: false, reason: `Failed to kill PID ${pid}. Try: sudo kill -9 ${pid}` };
    }
  }

  async getProcessName(pid: number): Promise<string> {
    try {
      return (await $`ps -p ${pid} -o comm=`.text()).trim() || "unknown";
    } catch {
      return "unknown";
    }
  }

  pidExists(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
