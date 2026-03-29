export function createRequestDeduper() {
  const pending = new Map();

  function run(key, loader) {
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) {
      return Promise.resolve().then(() => loader());
    }
    if (pending.has(normalizedKey)) {
      return pending.get(normalizedKey);
    }
    const request = Promise.resolve()
      .then(() => loader())
      .finally(() => {
        if (pending.get(normalizedKey) === request) {
          pending.delete(normalizedKey);
        }
      });
    pending.set(normalizedKey, request);
    return request;
  }

  function clear(prefix = "") {
    const normalizedPrefix = String(prefix || "").trim();
    if (!normalizedPrefix) {
      pending.clear();
      return;
    }
    Array.from(pending.keys()).forEach((key) => {
      if (key.startsWith(normalizedPrefix)) {
        pending.delete(key);
      }
    });
  }

  return {
    run,
    clear,
    size() {
      return pending.size;
    },
  };
}
