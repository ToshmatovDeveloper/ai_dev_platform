import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PART_NAMES = [
  "api",
  "web",
  "modules",
  "shared",
  "tests",
  "infra",
  "ci",
  "scripts",
  "docs",
];

const PREFIX_TO_PART = [
  ["apps/api/", "api"],
  ["apps/web/", "web"],
  ["src/modules/", "modules"],
  ["src/shared/", "shared"],
  ["tests/", "tests"],
  ["infra/", "infra"],
  [".github/", "ci"],
  ["scripts/", "scripts"],
  ["docs/", "docs"],
];

const CODE_PARTS = ["api", "web", "modules", "shared", "tests"];

const SHARED_CONFIG_FILES = new Set([
  "global.json",
  "Directory.Build.props",
  "Directory.Packages.props",
  "NuGet.config",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
]);

function normalize(file) {
  return file
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .trim();
}

function isMarkdown(file) {
  return /\.md$/i.test(file);
}

function isSharedConfig(file) {
  const base = file.split("/").pop() ?? "";

  if (base.toLowerCase().endsWith(".sln")) {
    return true;
  }

  return !file.includes("/") && SHARED_CONFIG_FILES.has(base);
}

export function changedParts(files) {
  const parts = Object.fromEntries(PART_NAMES.map((name) => [name, false]));

  for (const raw of files) {
    const file = normalize(raw);

    if (file.length === 0) {
      continue;
    }

    if (isMarkdown(file)) {
      parts.docs = true;
      continue;
    }

    if (isSharedConfig(file)) {
      for (const name of CODE_PARTS) {
        parts[name] = true;
      }
      continue;
    }

    for (const [prefix, name] of PREFIX_TO_PART) {
      if (file.startsWith(prefix)) {
        parts[name] = true;
        break;
      }
    }
  }

  return parts;
}

const modulePath = fileURLToPath(import.meta.url);

function isMainModule() {
  const entry = process.argv[1];

  if (!entry) {
    return false;
  }

  const resolved = resolve(entry);

  if (process.platform === "win32") {
    return resolved.toLowerCase() === modulePath.toLowerCase();
  }

  return resolved === modulePath;
}

function runCli() {
  const input = readFileSync(0, "utf8");
  const files = input.split(/\r?\n/);
  const parts = changedParts(files);

  for (const name of PART_NAMES) {
    console.log(`${name}=${parts[name]}`);
  }
}

if (isMainModule()) {
  runCli();
}
