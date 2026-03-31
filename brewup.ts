#!/usr/bin/env bun
// brewup.ts — Composition root (Hexagonal Architecture)
// Wires adapters → ports → core. No business logic here.

import { BrewUpApp } from "./src/brewup/core.ts";
import { HomebrewAdapter } from "./src/brewup/adapters/homebrew.ts";
import { FileLoggerAdapter } from "./src/brewup/adapters/file-logger.ts";
import { TerminalUIAdapter } from "./src/brewup/adapters/terminal.ts";

// ─── Assemble ────────────────────────────────────────────────────────────────
const pm = new HomebrewAdapter();
const ui = new TerminalUIAdapter();
const logger = new FileLoggerAdapter(`${process.env.HOME}/.brewup.log`);
const app = new BrewUpApp(pm, ui, logger);

// ─── Run ─────────────────────────────────────────────────────────────────────
app.run();
