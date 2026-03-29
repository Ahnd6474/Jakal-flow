import { useEffect, useRef, useState } from "react";

function schedulePersistence(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: 250 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, 120);
  return () => window.clearTimeout(handle);
}

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch (_error) {
      return initialValue;
    }
  });
  const serializedValueRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (serializedValueRef.current === serializedValue) {
        return undefined;
      }
      const cancelPersistence = schedulePersistence(() => {
        try {
          window.localStorage.setItem(key, serializedValue);
          serializedValueRef.current = serializedValue;
        } catch (_error) {
          // Ignore persistence failures and keep the UI usable.
        }
      });
      return cancelPersistence;
    } catch (_error) {
      // Ignore persistence failures and keep the UI usable.
      return undefined;
    }
  }, [key, value]);

  return [value, setValue];
}
