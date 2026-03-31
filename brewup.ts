#!/usr/bin/env bun
// brewup.ts — Composition root (Hexagonal Architecture)
// Wires adapters → ports → core. No business logic here.

import { BrewUpApp } from "./brewup/core.ts";
import { HomebrewAdapter } from "./brewup/homebrew-adapter.ts";
import { FileLoggerAdapter } from "./brewup/file-logger-adapter.ts";
import { TerminalUIAdapter } from "./brewup/terminal-adapter.ts";

// ─── Assemble ────────────────────────────────────────────────────────────────
const pm = new HomebrewAdapter();
const ui = new TerminalUIAdapter();
const logger = new FileLoggerAdapter(`${process.env.HOME}/.brewup.log`);
const app = new BrewUpApp(pm, ui, logger);

// ─── Run ─────────────────────────────────────────────────────────────────────
app.run();
