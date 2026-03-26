import assert from "node:assert/strict";
import test from "node:test";

import { resolveConfirmation } from "../src/controllerHelpers.js";

test("resolveConfirmation accepts an explicit native confirmation", async () => {
  const confirmed = await resolveConfirmation(async () => true, () => false, "Delete project?");

  assert.equal(confirmed, true);
});

test("resolveConfirmation respects an explicit cancellation", async () => {
  const confirmed = await resolveConfirmation(async () => false, () => true, "Delete project?");

  assert.equal(confirmed, false);
});

test("resolveConfirmation falls back when the native dialog does not return a boolean", async () => {
  const confirmed = await resolveConfirmation(async () => undefined, () => false, "Delete project?");

  assert.equal(confirmed, false);
});

test("resolveConfirmation falls back when the native dialog throws", async () => {
  const confirmed = await resolveConfirmation(
    async () => {
      throw new Error("dialog unavailable");
    },
    () => true,
    "Delete project?",
  );

  assert.equal(confirmed, true);
});
