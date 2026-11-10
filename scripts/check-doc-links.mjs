import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const roots = [
  "AGENTS.md",
  "CODING_STANDARDS.md",
  "DOMAIN.md",
  "customer-requirements(1).md",
  "docs",
  ".github",
];

const ignoredDirectories = new Set([".git", "node_modules", ".opencode", "bin", "obj", "dist"]);

const inlineLink = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const referenceLink = /^\s*\[[^\]]+\]:\s*(\S+)/gm;
const inlineCode = /`[^`]*`/g;

function collectMarkdownFiles(entry, files) {
  if (!existsSync(entry)) {
    return;
  }

  const stats = statSync(entry);

  if (stats.isDirectory()) {
    for (const child of readdirSync(entry)) {
      if (ignoredDirectories.has(child)) {
        continue;
      }

      collectMarkdownFiles(join(entry, child), files);
    }

    return;
  }

  if (stats.isFile() && extname(entry).toLowerCase() === ".md") {
    files.push(entry);
  }
}

function isExternal(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//");
}

function normalizeTarget(target) {
  const withoutFragment = target.split("#")[0].split("?")[0];

  try {
    return decodeURI(withoutFragment);
  } catch {
    return withoutFragment;
  }
}

function resolveTarget(file, target) {
  const normalized = normalizeTarget(target);

  if (normalized.length === 0) {
    return null;
  }

  if (normalized.startsWith("/")) {
    return join(repoRoot, normalized.slice(1));
  }

  return resolve(dirname(file), normalized);
}

function findLinks(file) {
  const content = readFileSync(file, "utf8");
  const links = [];
  let inFence = false;

  content.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inFence = !inFence;
      return;
    }

    if (inFence) {
      return;
    }

    const withoutCode = line.replace(inlineCode, "");

    for (const match of withoutCode.matchAll(inlineLink)) {
      links.push({ line: index + 1, target: match[1] });
    }

    for (const match of withoutCode.matchAll(referenceLink)) {
      links.push({ line: index + 1, target: match[1] });
    }
  });

  return links;
}

const files = [];
for (const root of roots) {
  collectMarkdownFiles(join(repoRoot, root), files);
}

const failures = [];

for (const file of files) {
  for (const link of findLinks(file)) {
    if (isExternal(link.target)) {
      continue;
    }

    const resolved = resolveTarget(file, link.target);

    if (resolved === null) {
      continue;
    }

    if (!existsSync(resolved)) {
      failures.push(
        `${relative(repoRoot, file)}:${link.line}: missing target '${link.target}'`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`Broken documentation links: ${failures.length}`);
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(`Checked ${files.length} Markdown files. No broken links.`);
