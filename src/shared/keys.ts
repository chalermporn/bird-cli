// shared/keys.ts — Shared keypress detection for raw terminal input
// Used by any module that needs interactive TUI input.

export type Key = "UP" | "DOWN" | "SPACE" | "ENTER" | "ALL" | "QUIT" | "ESC" | "OTHER";

/**
 * Read a single keypress from raw stdin.
 * @param onCtrlC Optional cleanup callback before exit on Ctrl-C
 */
export function readKey(onCtrlC?: () => void): Promise<Key> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.once("data", (data: Buffer) => {
      stdin.setRawMode(false);
      stdin.pause();

      // Arrow keys: ESC [ A/B
      if (data[0] === 0x1b && data[1] === 0x5b) {
        if (data[2] === 0x41) return resolve("UP");
        if (data[2] === 0x42) return resolve("DOWN");
        return resolve("ESC");
      }
      if (data[0] === 0x1b) return resolve("ESC");
      if (data[0] === 0x20) return resolve("SPACE");
      if (data[0] === 0x0d || data[0] === 0x0a) return resolve("ENTER");
      if (data[0] === 0x03) {
        onCtrlC?.();
        process.exit(0);
      }
      if (data[0] === 0x61 || data[0] === 0x41) return resolve("ALL");
      if (data[0] === 0x71 || data[0] === 0x51) return resolve("QUIT");
      resolve("OTHER");
    });
  });
}
