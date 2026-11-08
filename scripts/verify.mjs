import { execFileSync } from "node:child_process";
import { accessSync, constants, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PART_NAMES, changedParts } from "./changed-parts.mjs";
import { verifyPlan } from "./verify-plan.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const full = process.argv.includes("--full");
const failures = [];

function findExecutable(command) {
  if (command.includes("/") || command.includes("\\")) {
    return existsSync(command) ? command : null;
  }

  const pathValue = process.env.PATH ?? "";
  const directories = pathValue.split(delimiter).filter(Boolean);
  const extensions =
    process.platform === "win32"
      ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")
      : [""];

  for (const directory of directories) {
    for (const extension of extensions) {
      const candidate = join(directory, command + extension);

      try {
        accessSync(candidate, constants.F_OK);
        return candidate;
      } catch {
        continue;
      }
    }
  }

  return null;
}

function skipped(reason) {
  console.log(`skipped: ${reason}`);
}

function run(name, command, args, { optional = false } = {}) {
  console.log(`\n$ ${[command, ...args].join(" ")}`);

  try {
    if (process.platform === "win32") {
      execFileSync([command, ...args].join(" "), {
        cwd: repoRoot,
        stdio: "inherit",
        shell: true,
      });
    } else {
      execFileSync(command, args, {
        cwd: repoRoot,
        stdio: "inherit",
      });
    }

    return true;
  } catch (error) {
    if (error.code === "ENOENT" && optional) {
      skipped(`${name}: ${command} is not available`);
      return false;
    }

    console.error(`failed: ${name}`);
    failures.push(name);
    return false;
  }
}

function rootSolution() {
  return readdirSync(repoRoot).some((entry) => {
    if (!entry.toLowerCase().endsWith(".sln")) {
      return false;
    }

    try {
      return statSync(join(repoRoot, entry)).isFile();
    } catch {
      return false;
    }
  });
}

function packageScripts(path) {
  try {
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    return manifest && typeof manifest.scripts === "object" ? manifest.scripts : null;
  } catch {
    return null;
  }
}

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function mergeBase() {
  for (const ref of ["origin/main", "main"]) {
    try {
      const base = git(["merge-base", "HEAD", ref]);

      if (base) {
        return base;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function collectChangedFiles(base) {
  const files = new Set();

  const add = (text) => {
    for (const line of text.split(/\r?\n/)) {
      const file = line.trim();

      if (file) {
        files.add(file);
      }
    }
  };

  if (base) {
    add(git(["diff", "--name-only", base]));
  }

  add(git(["ls-files", "--others", "--exclude-standard"]));

  return [...files];
}

function changedPartsFromMain() {
  const base = mergeBase();

  if (!base) {
    console.log("note: could not determine base branch; running all checks");
    return Object.fromEntries(PART_NAMES.map((name) => [name, true]));
  }

  return changedParts(collectChangedFiles(base));
}

const parts = full ? {} : changedPartsFromMain();
const plan = verifyPlan(parts, full);

const hasSolution = rootSolution();
const webPackageJson = join(repoRoot, "apps", "web", "package.json");
const hasWebPackage = existsSync(webPackageJson);

if (plan.docs) {
  run("documentation links", "node", ["scripts/check-doc-links.mjs"]);
} else {
  skipped("documentation links: no documentation changes vs main");
}

if (plan.dotnet && hasSolution) {
  run("dotnet build", "dotnet", ["build"]);
  run("dotnet test", "dotnet", ["test"]);
} else if (!plan.dotnet) {
  skipped("dotnet build: no .NET changes vs main");
  skipped("dotnet test: no .NET changes vs main");
} else {
  skipped("dotnet build: no *.sln at repository root");
  skipped("dotnet test: no *.sln at repository root");
}

if (plan.web && hasWebPackage) {
  run("pnpm lint", "pnpm", ["--dir", "apps/web", "lint"]);
  run("pnpm typecheck", "pnpm", ["--dir", "apps/web", "typecheck"]);
  run("pnpm test", "pnpm", ["--dir", "apps/web", "test"]);
} else if (!plan.web) {
  skipped("pnpm lint: no web changes vs main");
  skipped("pnpm typecheck: no web changes vs main");
  skipped("pnpm test: no web changes vs main");
} else {
  skipped("pnpm lint: apps/web/package.json not found");
  skipped("pnpm typecheck: apps/web/package.json not found");
  skipped("pnpm test: apps/web/package.json not found");
}

if (full) {
  if (hasSolution) {
    run("dotnet vulnerability audit", "dotnet", [
      "list",
      "package",
      "--vulnerable",
      "--include-transitive",
    ]);
  } else {
    skipped("dotnet vulnerability audit: no *.sln at repository root");
  }

  const composeFile = join(repoRoot, "infra", "docker-compose.yml");

  if (existsSync(composeFile)) {
    if (findExecutable("docker")) {
      run("docker compose config", "docker", [
        "compose",
        "-f",
        "infra/docker-compose.yml",
        "config",
      ]);
    } else {
      skipped("docker compose config: docker is not available");
    }
  } else {
    skipped("docker compose config: infra/docker-compose.yml not found");
  }

  if (hasWebPackage) {
    const scripts = packageScripts(webPackageJson);

    if (scripts && Object.prototype.hasOwnProperty.call(scripts, "e2e")) {
      run("pnpm e2e", "pnpm", ["--dir", "apps/web", "e2e"]);
    } else {
      skipped('pnpm e2e: script "e2e" not found in apps/web/package.json');
    }
  } else {
    skipped("pnpm e2e: apps/web/package.json not found");
  }

  if (findExecutable("gitleaks")) {
    run("gitleaks", "gitleaks", ["git", "--redact", "--no-banner", "."]);
  } else {
    skipped("gitleaks: command not available");
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}

console.log("\nAll available checks passed.");
