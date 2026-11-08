import test from "node:test";
import assert from "node:assert/strict";

import { changedParts } from "./changed-parts.mjs";

const empty = {
  api: false,
  web: false,
  modules: false,
  shared: false,
  tests: false,
  infra: false,
  ci: false,
  scripts: false,
  docs: false,
};

function expectParts(files, expected) {
  assert.deepEqual(changedParts(files), { ...empty, ...expected });
}

test("returns all false for an empty list", () => {
  expectParts([], {});
});

test("documentation only sets docs", () => {
  expectParts(["docs/technical-foundation/implementation-plan.md"], { docs: true });
});

test("apps/api sets api", () => {
  expectParts(["apps/api/Program.cs"], { api: true });
});

test("apps/web sets web", () => {
  expectParts(["apps/web/src/main.tsx"], { web: true });
});

test("src/modules sets modules", () => {
  expectParts(["src/modules/Employees/Employee.cs"], { modules: true });
});

test("src/shared sets shared", () => {
  expectParts(["src/shared/SharedKernel/Ids.cs"], { shared: true });
});

test("tests sets tests", () => {
  expectParts(["tests/Api.IntegrationTests/StatusTests.cs"], { tests: true });
});

test("infra sets infra", () => {
  expectParts(["infra/docker-compose.yml"], { infra: true });
});

test("scripts sets scripts", () => {
  expectParts(["scripts/check-doc-links.mjs"], { scripts: true });
});

test(".github sets ci", () => {
  expectParts([".github/workflows/ci.yml"], { ci: true });
});

test("root Markdown sets docs only", () => {
  expectParts(["AGENTS.md", "DOMAIN.md", "customer-requirements(1).md"], { docs: true });
});

test("Markdown under a code path does not set a code part", () => {
  expectParts(["apps/api/README.md", "src/modules/Employees/README.md"], { docs: true });
});

test("each shared build configuration file triggers all code parts", () => {
  const sharedFiles = [
    "global.json",
    "Directory.Build.props",
    "Directory.Packages.props",
    "NuGet.config",
    "AiDevPlatform.sln",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
  ];

  for (const file of sharedFiles) {
    expectParts([file], { api: true, web: true, modules: true, shared: true, tests: true });
  }
});

test("mixed changes set every affected part", () => {
  expectParts(
    [
      "apps/api/Program.cs",
      "apps/web/src/main.tsx",
      "src/modules/Employees/Employee.cs",
      "src/shared/SharedKernel/Ids.cs",
      "tests/Api.UnitTests/IdsTests.cs",
      "infra/docker-compose.yml",
      ".github/workflows/ci.yml",
      "scripts/verify.mjs",
      "docs/agents/testing.md",
    ],
    {
      api: true,
      web: true,
      modules: true,
      shared: true,
      tests: true,
      infra: true,
      ci: true,
      scripts: true,
      docs: true,
    },
  );
});
