// brewup/adapters/file-logger.ts — Hexagonal Architecture: File-based logger adapter
// Implements LoggerPort using Bun.file for log rotation and writing

import type { LoggerPort } from "../ports.ts";

export class FileLoggerAdapter implements LoggerPort {
  constructor(private readonly logPath: string) {}

  async rotate(retentionDays: number): Promise<void> {
    const file = Bun.file(this.logPath);
    if (!(await file.exists())) return;

    const content = await file.text();
    const cutoff = Date.now() - retentionDays * 86_400_000;
    const blocks: string[] = [];
    let currentBlock = "";
    let blockDate = 0;

    for (const line of content.split("\n")) {
      if (line.startsWith("========")) {
        if (currentBlock && blockDate >= cutoff) {
          blocks.push(currentBlock);
        }
        currentBlock = line + "\n";
        blockDate = 0;
      } else {
        const match = line.match(/^Brew update started at (.+)$/);
        if (match) {
          const parsed = Date.parse(match[1]!);
          if (!isNaN(parsed)) blockDate = parsed;
        }
        currentBlock += line + "\n";
      }
    }

    if (currentBlock && blockDate >= cutoff) {
      blocks.push(currentBlock);
    }

    await Bun.write(this.logPath, blocks.join(""));
  }

  async log(line: string): Promise<void> {
    const file = Bun.file(this.logPath);
    const existing = (await file.exists()) ? await file.text() : "";
    await Bun.write(this.logPath, existing + line + "\n");
  }

  async writeHeader(): Promise<void> {
    await this.log("========================================");
    await this.log(`Brew update started at ${new Date().toString()}`);
    await this.log("========================================");
  }

  async writeFooter(ok: number, fail: number): Promise<void> {
    await this.log(
      `Brew update completed at ${new Date().toString()} — OK:${ok} FAIL:${fail}`,
    );
    await this.log("");
  }
}
