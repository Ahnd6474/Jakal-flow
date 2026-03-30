import assert from "node:assert/strict";
import test from "node:test";

import { beginProjectSelectionLoad, isCurrentProjectSelectionLoad } from "../src/controller/projectSelection.js";

test("project selection loads only accept the latest in-flight token", () => {
  const sequenceRef = { current: 0 };

  const firstLoad = beginProjectSelectionLoad(sequenceRef);
  const secondLoad = beginProjectSelectionLoad(sequenceRef);

  assert.equal(firstLoad, 1);
  assert.equal(secondLoad, 2);
  assert.equal(isCurrentProjectSelectionLoad(sequenceRef, firstLoad), false);
  assert.equal(isCurrentProjectSelectionLoad(sequenceRef, secondLoad), true);
});

test("project selection load guard rejects missing refs and empty tokens", () => {
  assert.equal(beginProjectSelectionLoad(null), 0);
  assert.equal(isCurrentProjectSelectionLoad(null, 1), false);
  assert.equal(isCurrentProjectSelectionLoad({ current: 3 }, 0), false);
});
