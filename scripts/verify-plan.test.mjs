import test from "node:test";
import assert from "node:assert/strict";

import { verifyPlan } from "./verify-plan.mjs";

function parts(overrides = {}) {
  return {
    api: false,
    web: false,
    modules: false,
    shared: false,
    tests: false,
    infra: false,
    ci: false,
    scripts: false,
    docs: false,
    ...overrides,
  };
}

test("docs-only change runs documentation checks only", () => {
  assert.deepEqual(verifyPlan(parts({ docs: true }), false), {
    docs: true,
    dotnet: false,
    web: false,
  });
});

test("api-only change runs .NET checks", () => {
  assert.deepEqual(verifyPlan(parts({ api: true }), false), {
    docs: true,
    dotnet: true,
    web: false,
  });
});

test("web-only change runs web checks", () => {
  assert.deepEqual(verifyPlan(parts({ web: true }), false), {
    docs: true,
    dotnet: false,
    web: true,
  });
});

test("modules-only change runs .NET checks", () => {
  assert.deepEqual(verifyPlan(parts({ modules: true }), false), {
    docs: true,
    dotnet: true,
    web: false,
  });
});

test("shared-only change runs .NET checks", () => {
  assert.deepEqual(verifyPlan(parts({ shared: true }), false), {
    docs: true,
    dotnet: true,
    web: false,
  });
});

test("tests-only change runs .NET checks", () => {
  assert.deepEqual(verifyPlan(parts({ tests: true }), false), {
    docs: true,
    dotnet: true,
    web: false,
  });
});

test("full mode always runs every check", () => {
  assert.deepEqual(verifyPlan(parts(), true), { docs: true, dotnet: true, web: true });
  assert.deepEqual(verifyPlan(parts({ api: true }), true), {
    docs: true,
    dotnet: true,
    web: true,
  });
  assert.deepEqual(verifyPlan(parts({ docs: true }), true), {
    docs: true,
    dotnet: true,
    web: true,
  });
});
