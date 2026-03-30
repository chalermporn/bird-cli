#!/usr/bin/env bun
// force-quit.ts — Interactive force quit for macOS applications

import { $ } from "bun";
import { basename } from "path";
import { createInterface } from "readline";

// ─── Colors ──────────────────────────────────────────────────────────────────
const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const CYAN = "\x1b[0;36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const CLEAR_LINE = "\x1b[K";

// ─── Usage ───────────────────────────────────────────────────────────────────
function usage(): never {
  const cmd = basename(process.argv[1] ?? "force-quit");
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  ${cmd}              # Interactive mode — list & pick app to kill`);
  console.log(`  ${cmd} -i           # Multi-select mode — toggle multiple apps to kill`);
  console.log(`  ${cmd} <app_name>   # Kill app by name (e.g. "Safari", "Finder")`);
  console.log(`  ${cmd} -p <PID>     # Kill by process ID`);
  console.log(`  ${cmd} -l           # List running GUI applications`);
  console.log(`  ${cmd} -h           # Show this help`);
  console.log();
  console.log(`${BOLD}Examples:${RESET}`);
  console.log(`  ${cmd} Safari`);
  console.log(`  ${cmd} -p 12345`);
  console.log(`  ${cmd}              # interactive picker`);
  process.exit(0);
}

// ─── Prompt helper ───────────────────────────────────────────────────────────
function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── List running GUI apps ───────────────────────────────────────────────────
async function listApps(): Promise<string[]> {
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

// ─── Check if process is running (by name) ───────────────────────────────────
async function isRunning(name: string): Promise<boolean> {
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

// ─── Force quit by app name ──────────────────────────────────────────────────
async function forceQuitByName(appName: string): Promise<void> {
  if (!(await isRunning(appName))) {
    console.log(`${RED}✗ '${appName}' is not running.${RESET}`);
    process.exit(1);
  }

  console.log(`${YELLOW}⚡ Force quitting '${appName}'...${RESET}`);

  // Try graceful quit first via AppleScript
  try {
    await $`osascript -e ${"tell application \"" + appName + "\" to quit"}`.quiet();
    await Bun.sleep(1000);
    if (!(await isRunning(appName))) {
      console.log(`${GREEN}✓ '${appName}' quit gracefully.${RESET}`);
      return;
    }
  } catch {
    // graceful quit failed, continue to force kill
  }

  // Force kill with killall
  try {
    await $`killall -9 ${appName}`.quiet();
    console.log(`${GREEN}✓ '${appName}' force killed.${RESET}`);
    return;
  } catch {
    // killall failed
  }

  // Try case-insensitive pkill as fallback
  try {
    await $`pkill -9 -if ${appName}`.quiet();
    console.log(`${GREEN}✓ '${appName}' force killed (via pkill).${RESET}`);
    return;
  } catch {
    console.log(
      `${RED}✗ Failed to kill '${appName}'. Try with sudo or check the name.${RESET}`
    );
    process.exit(1);
  }
}

// ─── Force quit by PID ──────────────────────────────────────────────────────
async function forceQuitByPid(pidStr: string): Promise<void> {
  const pid = Number(pidStr);
  if (!Number.isInteger(pid) || pid <= 0) {
    console.log(`${RED}✗ Invalid PID: '${pidStr}'${RESET}`);
    process.exit(1);
  }

  // Check if process exists
  try {
    process.kill(pid, 0);
  } catch {
    console.log(`${RED}✗ No process with PID ${pid}.${RESET}`);
    process.exit(1);
  }

  // Get process name
  let procName = "unknown";
  try {
    procName = (await $`ps -p ${pid} -o comm=`.text()).trim() || "unknown";
  } catch {
    // ignore
  }

  console.log(`${YELLOW}⚡ Force killing PID ${pid} (${procName})...${RESET}`);

  try {
    process.kill(pid, 9);
    console.log(`${GREEN}✓ PID ${pid} killed.${RESET}`);
  } catch {
    console.log(
      `${RED}✗ Failed to kill PID ${pid}. Try: sudo kill -9 ${pid}${RESET}`
    );
    process.exit(1);
  }
}

// ─── Interactive picker (single select) ──────────────────────────────────────
async function interactivePicker(): Promise<void> {
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║    ⚡ Force Quit Application         ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}`);
  console.log();

  const apps = await listApps();
  if (apps.length === 0) {
    console.log(`${RED}✗ No GUI applications found.${RESET}`);
    process.exit(1);
  }

  // Display numbered list
  apps.forEach((app, i) => {
    const num = String(i + 1).padStart(2);
    console.log(`  ${CYAN}${num})${RESET} ${app}`);
  });

  console.log();
  console.log(`  ${CYAN} 0)${RESET} Cancel`);
  console.log();

  const choice = await prompt(
    `${BOLD}Select app to force quit [0-${apps.length}]: ${RESET}`
  );

  const num = Number(choice);
  if (!choice || isNaN(num)) {
    console.log(`${YELLOW}Cancelled.${RESET}`);
    process.exit(0);
  }
  if (num === 0) {
    console.log(`${YELLOW}Cancelled.${RESET}`);
    process.exit(0);
  }
  if (num < 1 || num > apps.length) {
    console.log(`${RED}✗ Invalid selection.${RESET}`);
    process.exit(1);
  }

  const selected = apps[num - 1]!;
  const confirm = await prompt(
    `${YELLOW}Force quit '${selected}'? [y/N]: ${RESET}`
  );
  if (confirm.toLowerCase() === "y") {
    await forceQuitByName(selected);
  } else {
    console.log(`${YELLOW}Cancelled.${RESET}`);
  }
}

// ─── Read a single keypress ──────────────────────────────────────────────────
type Key = "UP" | "DOWN" | "SPACE" | "ENTER" | "ALL" | "QUIT" | "ESC" | "OTHER";

function readKey(): Promise<Key> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.once("data", (data: Buffer) => {
      stdin.setRawMode(false);
      stdin.pause();

      // Arrow keys: ESC [ A/B
      if (data[0] === 0x1b && data[1] === 0x5b) {
        if (data[2] === 0x41) return resolve("UP");
        if (data[2] === 0x42) return resolve("DOWN");
        return resolve("ESC");
      }
      // Single ESC
      if (data[0] === 0x1b) return resolve("ESC");
      // Space
      if (data[0] === 0x20) return resolve("SPACE");
      // Enter
      if (data[0] === 0x0d || data[0] === 0x0a) return resolve("ENTER");
      // Ctrl+C
      if (data[0] === 0x03) {
        process.stdout.write("\x1b[?25h"); // show cursor
        process.exit(0);
      }
      // a/A
      if (data[0] === 0x61 || data[0] === 0x41) return resolve("ALL");
      // q/Q
      if (data[0] === 0x71 || data[0] === 0x51) return resolve("QUIT");

      resolve("OTHER");
    });
  });
}

// ─── Multi-select interactive picker (TUI) ───────────────────────────────────
async function multiSelectPicker(): Promise<void> {
  const apps = await listApps();
  if (apps.length === 0) {
    console.log(`${RED}✗ No GUI applications found.${RESET}`);
    process.exit(1);
  }

  const count = apps.length;
  let cursor = 0;
  const selected = new Array<boolean>(count).fill(false);

  // Hide cursor
  process.stdout.write("\x1b[?25l");

  // Restore cursor on exit
  const cleanup = () => {
    process.stdout.write("\x1b[?25h");
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });

  const totalLines = 4 + count + 5;
  let firstDraw = true;

  while (true) {
    // Move cursor up to redraw
    if (!firstDraw) {
      process.stdout.write(`\x1b[${totalLines}A`);
    }
    firstDraw = false;

    const selCount = selected.filter(Boolean).length;

    // Header
    process.stdout.write(
      `${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}${CLEAR_LINE}\n`
    );
    process.stdout.write(
      `${BOLD}${CYAN}║  ⚡ Force Quit — Multi Select        ║${RESET}${CLEAR_LINE}\n`
    );
    process.stdout.write(
      `${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}${CLEAR_LINE}\n`
    );
    process.stdout.write(
      ` Selected: ${BOLD}${CYAN}${selCount}${RESET} / ${count}${CLEAR_LINE}\n`
    );

    // App list
    for (let j = 0; j < count; j++) {
      const pointer = j === cursor ? `${CYAN}▸${RESET} ` : "  ";
      const check = selected[j] ? `${GREEN}●${RESET}` : "○";
      const nameColor = selected[j] ? GREEN : "";
      process.stdout.write(
        `  ${pointer} ${check} ${nameColor}${apps[j]}${RESET}${CLEAR_LINE}\n`
      );
    }

    // Footer
    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(
      `  ${CYAN}↑↓${RESET} Move  ${CYAN}Space${RESET} Toggle  ${CYAN}a${RESET} All  ${CYAN}Enter${RESET} Confirm  ${CYAN}q${RESET} Quit${CLEAR_LINE}\n`
    );
    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(`${CLEAR_LINE}\n`);

    const key = await readKey();

    switch (key) {
      case "UP":
        cursor = (cursor - 1 + count) % count;
        break;
      case "DOWN":
        cursor = (cursor + 1) % count;
        break;
      case "SPACE":
        selected[cursor] = !selected[cursor];
        break;
      case "ALL": {
        const allOn = selected.every(Boolean);
        selected.fill(!allOn);
        break;
      }
      case "ENTER": {
        // Show cursor again
        process.stdout.write("\x1b[?25h");

        const toKill = apps.filter((_, i) => selected[i]);
        if (toKill.length === 0) {
          console.log();
          console.log(`${YELLOW}No apps selected.${RESET}`);
          process.exit(0);
        }

        console.log();
        console.log(`${BOLD}Will force quit:${RESET}`);
        for (const app of toKill) {
          console.log(`  ${RED}✗${RESET} ${app}`);
        }
        console.log();

        const confirm = await prompt(`${YELLOW}Confirm? [y/N]: ${RESET}`);
        if (confirm.toLowerCase() === "y") {
          for (const app of toKill) {
            await forceQuitByName(app);
          }
        } else {
          console.log(`${YELLOW}Cancelled.${RESET}`);
        }
        process.exit(0);
        break;
      }
      case "QUIT":
      case "ESC":
        process.stdout.write("\x1b[?25h");
        console.log();
        console.log(`${YELLOW}Cancelled.${RESET}`);
        process.exit(0);
        break;
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await interactivePicker();
    return;
  }

  // Parse flags
  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;

    if (arg === "-h" || arg === "--help") {
      usage();
    } else if (arg === "-l" || arg === "--list") {
      console.log(`${BOLD}Running GUI Applications:${RESET}`);
      const apps = await listApps();
      for (const app of apps) {
        console.log(`  ${CYAN}•${RESET} ${app}`);
      }
      process.exit(0);
    } else if (arg === "-p" || arg === "--pid") {
      const pid = args[i + 1];
      if (!pid) {
        console.log(`${RED}✗ Option -p requires a PID argument.${RESET}`);
        process.exit(1);
      }
      await forceQuitByPid(pid);
      process.exit(0);
    } else if (arg === "-i" || arg === "--interactive") {
      await multiSelectPicker();
      process.exit(0);
    } else if (arg.startsWith("-")) {
      console.log(`${RED}✗ Unknown option: ${arg}${RESET}`);
      usage();
    } else {
      // Treat remaining args as app name
      const appName = args.slice(i).join(" ");
      await forceQuitByName(appName);
      process.exit(0);
    }
    i++;
  }
}

main();
