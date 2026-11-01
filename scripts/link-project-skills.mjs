#!/usr/bin/env node
// Link the canonical project skills into each agent's native discovery path.
//
// Source of truth: .opencode/skills (OpenCode's project skill directory).
// Links:
//   .claude/skills -> .opencode/skills   (Claude Code)
//
// Run once after cloning, and again if a link is missing or broken:
//   node scripts/link-project-skills.mjs
// On Windows this creates a directory junction, so it needs no admin rights.

import { existsSync, lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, ".opencode", "skills");
const links = [{ path: join(root, ".claude", "skills"), label: "Claude Code" }];

if (!existsSync(source)) {
  console.error(`Missing skills directory: ${relative(root, source)}`);
  process.exit(1);
}

let failed = false;

for (const link of links) {
  const rel = relative(root, link.path);
  const target = relative(dirname(link.path), source);
  mkdirSync(dirname(link.path), { recursive: true });

  if (existsSync(link.path) || isLink(link.path)) {
    if (!isLink(link.path)) {
      console.error(
        `${rel} is a real directory. Move it away (or delete it) and run this script again.`,
      );
      failed = true;
      continue;
    }

    const current = resolve(dirname(link.path), readlinkSync(link.path));
    if (current === source) {
      console.log(`ok       ${rel} -> ${target}`);
      continue;
    }

    console.log(`replace  ${rel} (pointed to ${relative(root, current)})`);
    rmSync(link.path, { recursive: true, force: true });
  }

  try {
    // Junction on Windows: no admin/Developer Mode required, and it survives normal edits.
    symlinkSync(source, link.path, process.platform === "win32" ? "junction" : "dir");
    console.log(`linked   ${rel} -> ${target}  (${link.label})`);
  } catch (error) {
    console.error(`failed   ${rel}: ${error.message}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);

function isLink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}
