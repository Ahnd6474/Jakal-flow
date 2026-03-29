export function arePropsEqualExceptFunctions(previousProps = {}, nextProps = {}) {
  const keys = new Set([
    ...Object.keys(previousProps || {}),
    ...Object.keys(nextProps || {}),
  ]);
  for (const key of keys) {
    const previousValue = previousProps?.[key];
    const nextValue = nextProps?.[key];
    if (typeof previousValue === "function" && typeof nextValue === "function") {
      continue;
    }
    if (!Object.is(previousValue, nextValue)) {
      return false;
    }
  }
  return true;
}
