import { useEffect, useRef, useState } from "react";
import { scheduleIdleTask } from "../lazyLoad";

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
      const cancelPersistence = scheduleIdleTask(() => {
        try {
          window.localStorage.setItem(key, serializedValue);
          serializedValueRef.current = serializedValue;
        } catch (_error) {
          // Ignore persistence failures and keep the UI usable.
        }
      }, { idleTimeout: 250, fallbackDelay: 120 });
      return cancelPersistence;
    } catch (_error) {
      // Ignore persistence failures and keep the UI usable.
      return undefined;
    }
  }, [key, value]);

  return [value, setValue];
}
