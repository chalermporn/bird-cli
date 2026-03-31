// brewup/index.ts — Module entry point (composition root + runner)

import { BrewUpApp } from "./core.ts";
import { HomebrewAdapter } from "./adapters/homebrew.ts";
import { FileLoggerAdapter } from "./adapters/file-logger.ts";
import { TerminalUIAdapter } from "./adapters/terminal.ts";

export async function run(_args: string[]): Promise<void> {
  const pm = new HomebrewAdapter();
  const ui = new TerminalUIAdapter();
  const logger = new FileLoggerAdapter(`${process.env.HOME}/.brewup.log`);
  const app = new BrewUpApp(pm, ui, logger);

  await app.run();
}
