import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", "dist", "node_modules"]);
const failures = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else files.push(fullPath);
  }

  return files;
}

for (const file of await walk(root)) {
  if (/\.(?:m?js)$/.test(file)) {
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(`${path.relative(root, file)}\n${result.stderr}`);
    }
  }

  if (file.endsWith(".json")) {
    try {
      JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      failures.push(`${path.relative(root, file)}\n${error.message}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n\n"));
  process.exitCode = 1;
} else {
  console.log("Syntax and JSON checks passed.");
}

