import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDir);
const storageDir = join(projectRoot, ".localstorage");
const storageFile = join(storageDir, "next-localstorage.sqlite");

mkdirSync(storageDir, { recursive: true });

const existingOptions = process.env.NODE_OPTIONS?.trim();
const localStorageOption = `--localstorage-file=${storageFile}`;
const nodeOptions = existingOptions
  ? `${existingOptions} ${localStorageOption}`
  : localStorageOption;

const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
