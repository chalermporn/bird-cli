// src/cli.ts — Unified CLI dispatcher
// Routes subcommands to the correct module.

import { run as brewup } from "./brewup/index.ts";
import { run as forceQuit } from "./force-quit/index.ts";
import { run as install } from "./install/index.ts";
import { BOLD, CYAN, GREEN, YELLOW, RED, RESET, CLEAR_LINE } from "./shared/colors.ts";
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
  console.log(`${BOLD}${CYAN}  🐦 bird-cli${RESET} — Unified script toolkit`);
  console.log();
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  bird-cli ${CYAN}<command>${RESET} [options]`);
  console.log(`  bird-cli ${CYAN}-l${RESET}               List available commands`);
  console.log(`  bird-cli ${CYAN}-i${RESET}               Interactive command picker`);
  console.log(`  bird-cli ${CYAN}-h${RESET}               Show this help`);
  console.log();
  showCommands();
  console.log(`${BOLD}Examples:${RESET}`);
  console.log(`  bird-cli brewup            # Update Homebrew`);
  console.log(`  bird-cli force-quit -l     # List running apps`);
  console.log(`  bird-cli force-quit -i     # Multi-select force quit`);
  console.log(`  bird-cli force-quit Safari # Force quit Safari`);
  console.log(`  bird-cli install -i        # Interactive script install`);
  console.log();
}

function showCommands(): void {
  console.log(`${BOLD}Commands:${RESET}`);
  for (const [name, cmd] of Object.entries(commands)) {
    console.log(`  ${GREEN}${name.padEnd(14)}${RESET} ${cmd.description}`);
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

    process.stdout.write(`${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}${CLEAR_LINE}\n`);
    process.stdout.write(`${BOLD}${CYAN}║  🐦 Select a command                ║${RESET}${CLEAR_LINE}\n`);
    process.stdout.write(`${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}${CLEAR_LINE}\n`);

    for (let i = 0; i < total; i++) {
      const [name, cmd] = entries[i]!;
      const ptr = i === cursor ? `${CYAN}▸${RESET} ` : "  ";
      const nameColor = i === cursor ? `${BOLD}${GREEN}` : "";
      process.stdout.write(`  ${ptr} ${nameColor}${name.padEnd(14)}${RESET} ${cmd.description}${CLEAR_LINE}\n`);
    }

    process.stdout.write(`${CLEAR_LINE}\n`);
    process.stdout.write(`  ${CYAN}↑↓${RESET} Move  ${CYAN}Enter${RESET} Run  ${CYAN}q${RESET} Quit${CLEAR_LINE}\n`);
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
        console.log(`${BOLD}${CYAN}▶ Running ${name}…${RESET}\n`);
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
    console.log(`${RED}✗ Unknown command: '${cmdName}'${RESET}`);
    console.log();
    showCommands();
    process.exit(1);
  }

  await command.run(args.slice(1));
}

main();
