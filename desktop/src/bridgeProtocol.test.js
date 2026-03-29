import test from "node:test";
import assert from "node:assert/strict";

import { BRIDGE_COMMANDS, isBridgeMutationCommand } from "./bridgeProtocol.js";

test("contract-wave bridge commands are marked as mutations", () => {
  assert.equal(isBridgeMutationCommand(BRIDGE_COMMANDS.RESOLVE_COMMON_REQUIREMENT), true);
  assert.equal(isBridgeMutationCommand(BRIDGE_COMMANDS.REOPEN_COMMON_REQUIREMENT), true);
  assert.equal(isBridgeMutationCommand(BRIDGE_COMMANDS.RECORD_SPINE_CHECKPOINT), true);
  assert.equal(isBridgeMutationCommand(BRIDGE_COMMANDS.UPDATE_COMMON_REQUIREMENT), true);
  assert.equal(isBridgeMutationCommand(BRIDGE_COMMANDS.DELETE_COMMON_REQUIREMENT), true);
  assert.equal(isBridgeMutationCommand(BRIDGE_COMMANDS.UPDATE_SPINE_CHECKPOINT), true);
  assert.equal(isBridgeMutationCommand(BRIDGE_COMMANDS.DELETE_SPINE_CHECKPOINT), true);
});
