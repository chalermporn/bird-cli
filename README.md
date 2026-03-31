# 🐦 bird-cli

Unified macOS script toolkit — Homebrew updater, app force-quitter, and script installer in one command.

Built with [Bun](https://bun.sh) + TypeScript. Hexagonal architecture. Dark-theme TUI.

## Install

```bash
# Clone & install globally
git clone https://github.com/chalermporn/bird-cli.git
cd bird-cli
bun install
bun link
```

Now `bird-cli` is available globally.

## Usage

```
bird-cli <command> [options]
bird-cli -i          Interactive command picker
bird-cli -l          List available commands
bird-cli -h          Show help
```

## Commands

### 🍺 brewup — Update all Homebrew packages

Fully automated — runs `brew update`, upgrades all formulae & casks individually, runs cleanup, and optionally upgrades Mac App Store apps via `mas`.

```bash
bird-cli brewup
```

Logs each session to `~/.brewup.log` (7-day rotation).

---

### ⚡ force-quit — Force quit macOS applications

Attempts graceful quit first, then force kill.

```bash
bird-cli force-quit              # Interactive single-select picker
bird-cli force-quit -i           # Multi-select TUI (toggle multiple apps)
bird-cli force-quit Safari       # Kill by name
bird-cli force-quit -p 12345    # Kill by PID
bird-cli force-quit -l           # List running GUI apps
bird-cli force-quit -h           # Help
```

---

### 📦 install — Install shell scripts to ~/bin

Discovers `.sh` scripts in the project, symlinks to `~/bin`, and configures PATH.

```bash
bird-cli install                 # Install all scripts
bird-cli install -i              # Interactive select
bird-cli install --list          # Preview what would be installed
bird-cli install --uninstall     # Remove installed symlinks
bird-cli install -h              # Help
```

## Project Structure

```
bird-cli.ts                      # Entry point (#!/usr/bin/env bun)
src/
├── cli.ts                       # Unified dispatcher + interactive picker
├── shared/
│   ├── colors.ts                # Dark-theme palette + icon set
│   ├── keys.ts                  # Raw keypress reader
│   ├── multi-select.ts          # Reusable TUI multi-select component
│   └── terminal.ts              # Cursor utilities
├── brewup/
│   ├── index.ts                 # Module entry + arg routing
│   ├── core.ts                  # Domain logic
│   ├── ports.ts                 # Port interfaces
│   └── adapters/
│       ├── terminal.ts          # UI adapter
│       ├── homebrew.ts          # Homebrew CLI adapter
│       └── file-logger.ts       # Log file adapter
├── force-quit/
│   ├── index.ts
│   ├── core.ts
│   ├── ports.ts
│   └── adapters/
│       ├── terminal.ts          # UI adapter
│       └── macos.ts             # macOS process adapter
└── install/
    ├── index.ts
    ├── core.ts
    ├── ports.ts
    └── adapters/
        ├── terminal.ts          # UI adapter
        └── fs.ts                # File system adapter
```

Each module follows **hexagonal architecture** — ports define interfaces, adapters implement them, core contains pure domain logic.

## Requirements

- [Bun](https://bun.sh) ≥ 1.0
- macOS (force-quit uses macOS-specific APIs)
- [Homebrew](https://brew.sh) (for brewup)

## License

MIT
