// shared/logo.ts — ASCII welcome logo for bird-cli

import figlet from "figlet";
import { accentBold, dim } from "./colors.ts";

export function printLogo(): void {
  const ascii = figlet.textSync("Bird-cli", { font: "Standard" });

  ascii
    .split("\n")
    .forEach((line) => process.stdout.write(`  ${accentBold(line)}\n`));

  console.log();
  console.log(`  ${dim("Unified script toolkit")}`);
  console.log();
}
