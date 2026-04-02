import assert from "node:assert/strict";
import test from "node:test";

import { normalizeVariant, releaseCopyPlan, releaseNameForVariant, tauriBuildArgs } from "../scripts/build-release.mjs";

test("normalizeVariant defaults to full and rejects unsupported variants", () => {
  assert.equal(normalizeVariant(""), "full");
  assert.equal(normalizeVariant(" lean "), "lean");
  assert.throws(() => normalizeVariant("portable"), /Unsupported desktop release variant/);
});

test("releaseNameForVariant keeps full names and suffixes lean artifacts", () => {
  assert.equal(releaseNameForVariant("jakal-flow Desktop_0.1.0_x64-setup.exe", "full"), "jakal-flow Desktop_0.1.0_x64-setup.exe");
  assert.equal(releaseNameForVariant("jakal-flow Desktop_0.1.0_x64-setup.exe", "lean"), "jakal-flow Desktop_0.1.0_x64-setup_lean.exe");
  assert.equal(releaseNameForVariant("jakal-flow Desktop_0.1.0_x64_en-US.msi", "lean"), "jakal-flow Desktop_0.1.0_x64_en-US_lean.msi");
});

test("tauriBuildArgs adds lean config only for lean variant", () => {
  assert.deepEqual(tauriBuildArgs("full"), ["build"]);
  assert.deepEqual(tauriBuildArgs("lean").slice(0, 2), ["build", "--config"]);
  assert.match(tauriBuildArgs("lean")[2], /tauri\.lean\.conf\.json$/);
});

test("releaseCopyPlan maps every bundle artifact to the expected release name", () => {
  const plan = releaseCopyPlan(
    ["jakal-flow Desktop_0.1.0_x64-setup.exe", "jakal-flow Desktop_0.1.0_x64_en-US.msi"],
    "lean",
  );
  assert.deepEqual(plan, [
    {
      sourceName: "jakal-flow Desktop_0.1.0_x64-setup.exe",
      targetName: "jakal-flow Desktop_0.1.0_x64-setup_lean.exe",
    },
    {
      sourceName: "jakal-flow Desktop_0.1.0_x64_en-US.msi",
      targetName: "jakal-flow Desktop_0.1.0_x64_en-US_lean.msi",
    },
  ]);
});
