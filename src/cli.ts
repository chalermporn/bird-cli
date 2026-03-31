// src/cli.ts — Unified CLI dispatcher
// Routes subcommands to the correct module.

import { run as brewup } from "./brewup/index.ts";
import { run as forceQuit } from "./force-quit/index.ts";
import { run as install } from "./install/index.ts";
import { pc, CLEAR_LINE } from "./shared/colors.ts";
import { readKey } from "./shared/keys.ts";
import { hideCursor, showCursor } from "./shared/terminal.ts";

// ─── Command registry ────────────────────────────────────────────────────────

interface Command {
  description: string;
  run: (args: string[]) => Promise<void>;
}

const commands: Record<string, Command> = {
  brewup: {
    description: "Update all Homebrew packages",
    run: brewup,
  },
  "force-quit": {
    description: "Force quit macOS applications",
    run: forceQuit,
  },
  install: {
    description: "Install shell scripts to ~/bin",
    run: install,
  },
};

// ─── Help & list ─────────────────────────────────────────────────────────────

function showHelp(): void {
  console.log();
  console.log(`  ${pc.bold(pc.cyan("🐦 bird-cli"))} ${pc.dim("— Unified script toolkit")}`);
  console.log();
  console.log(pc.bold("Usage:"));
  console.log(`  bird-cli ${pc.cyan("<command>")} [options]`);
  console.log(`  bird-cli ${pc.cyan("-l")}               List available commands`);
  console.log(`  bird-cli ${pc.cyan("-i")}               Interactive command picker`);
  console.log(`  bird-cli ${pc.cyan("-h")}               Show this help`);
  console.log();
  showCommands();
  console.log(pc.bold("Examples:"));
  console.log(`  bird-cli brewup            ${pc.dim("# Update Homebrew")}`);
  console.log(`  bird-cli force-quit -l     ${pc.dim("# List running apps")}`);
  console.log(`  bird-cli force-quit -i     ${pc.dim("# Multi-select force quit")}`);
  console.log(`  bird-cli force-quit Safari ${pc.dim("# Force quit Safari")}`);
  console.log(`  bird-cli install -i        ${pc.dim("# Interactive script install")}`);
  console.log();
}

function showCommands(): void {
  console.log(pc.bold("Commands:"));
  for (const [name, cmd] of Object.entries(commands)) {
    console.log(`  ${pc.green(name.padEnd(14))} ${pc.dim(cmd.description)}`);
  }
  console.log();
}

// ─── Interactive picker ──────────────────────────────────────────────────────

async function interactivePicker(): Promise<void> {
  const entries = Object.entries(commands);
  let cursor = 0;
  const total = entries.length;
  const totalLines = 3 + total + 4; // 3 box lines + items + 4 footer lines
  let firstDraw = true;

  hideCursor();
  const cleanup = () => showCursor();
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(0); });
  process.on("SIGTERM", () => { cleanup(); process.exit(0); });

  while (true) {
    if (!firstDraw) process.stdout.write(`\x1b[${totalLines}A`);

    process.stdout.write(`${pc.bold(pc.cyan("╔══════════════════════════════════════╗"))}${CLEAR_LINE}\n`);
    process.stdout.write(`${pc.bold(pc.cyan("║  🐦 Select a command                ║"))}${CLEAR_LINE}\n`);
    process.stdout.write(`${pc.bold(pc.cyan("╚══════════════════════════════════════╝"))}${CLEAR_LINE}\n`);

    for (let i = 0; i < total; i++) {
      const [name, cmd] = entries[i]!;
      const ptr = i === cursor ? `${pc.cyan("▸")} ` : "  ";
      const label = i === cursor ? pc.bold(pc.green(name.padEnd(14))) : name.padEnd(14);
      const desc = i === cursor ? cmd.description : pc.dim(cmd.description);
      process.stdout.write(`  ${ptr} ${label} ${desc}${CLEAR_LINE}\n`);
    }

    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(`  ${pc.cyan("↑↓")} Move  ${pc.cyan("Enter")} Run  ${pc.cyan("q")} Quit${CLEAR_LINE}\n`);
    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(`${CLEAR_LINE}\n`);
    firstDraw = false;

    const key = await readKey(cleanup);

    switch (key) {
      case "UP":
        cursor = (cursor - 1 + total) % total;
        break;
      case "DOWN":
        cursor = (cursor + 1) % total;
        break;
      case "ENTER": {
        showCursor();
        console.log();
        const [name, cmd] = entries[cursor]!;
        console.log(`${pc.bold(pc.cyan(`▶ Running ${name}…`))}\n`);
        await cmd.run([]);
        return;
      }
      case "QUIT":
      case "ESC":
        showCursor();
        console.log();
        return;
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    showHelp();
    process.exit(0);
  }

  if (args[0] === "-l" || args[0] === "--list") {
    showCommands();
    process.exit(0);
  }

  if (args[0] === "-i" || args[0] === "--interactive") {
    await interactivePicker();
    process.exit(0);
  }

  const cmdName = args[0]!;
  const command = commands[cmdName];

  if (!command) {
    console.log(pc.red(`✗ Unknown command: '${cmdName}'`));
    console.log();
    showCommands();
    process.exit(1);
  }

  await command.run(args.slice(1));
}

main();
