// force-quit/index.ts — Module entry point (composition root + CLI routing)

import { ForceQuitApp } from "./core.ts";
import { MacOSSystemAdapter } from "./adapters/macos.ts";
import { TerminalUIAdapter } from "./adapters/terminal.ts";

export async function run(args: string[]): Promise<void> {
  const system = new MacOSSystemAdapter();
  const ui = new TerminalUIAdapter();
  const app = new ForceQuitApp(system, ui);

  if (args.length === 0) {
    await app.interactivePicker();
    return;
  }

  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;

    if (arg === "-h" || arg === "--help") {
      ui.showUsage("bird-cli force-quit");
      process.exit(0);
    } else if (arg === "-l" || arg === "--list") {
      await app.listApps();
      process.exit(0);
    } else if (arg === "-p" || arg === "--pid") {
      const pid = args[i + 1];
      if (!pid) {
        ui.error("Option -p requires a PID argument.");
        process.exit(1);
      }
      await app.quitByPid(pid);
      process.exit(0);
    } else if (arg === "-i" || arg === "--interactive") {
      await app.multiSelectPicker();
      process.exit(0);
    } else if (arg.startsWith("-")) {
      ui.error(`Unknown option: ${arg}`);
      ui.showUsage("bird-cli force-quit");
      process.exit(1);
    } else {
      const appName = args.slice(i).join(" ");
      await app.quitByName(appName);
      process.exit(0);
    }
    i++;
  }
}
