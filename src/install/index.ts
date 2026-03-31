// install/index.ts — Module entry point (composition root + CLI routing)

import { dirname } from "path";
import { InstallerApp } from "./core.ts";
import { LocalFSAdapter } from "./adapters/fs.ts";
import { TerminalUIAdapter } from "./adapters/terminal.ts";

export async function run(args: string[]): Promise<void> {
  const scriptDir = dirname(Bun.main);
  const installDir = `${process.env.HOME}/bin`;
  const fs = new LocalFSAdapter(scriptDir);
  const ui = new TerminalUIAdapter();
  const app = new InstallerApp(fs, ui, installDir);

  switch (args[0]) {
    case "-i":
    case "--interactive":
      await app.interactiveInstall();
      break;
    case "--uninstall":
      await app.uninstall();
      break;
    case "--list":
      await app.listScripts();
      break;
    case "-h":
    case "--help":
      ui.showUsage("bird-cli install");
      break;
    case undefined:
      await app.installAll();
      break;
    default:
      ui.error(`Unknown option: ${args[0]}`);
      ui.showUsage("bird-cli install");
      process.exit(1);
  }
}
