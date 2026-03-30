export function beginProjectSelectionLoad(sequenceRef) {
  if (!sequenceRef || typeof sequenceRef !== "object") {
    return 0;
  }
  const nextToken = Number(sequenceRef.current || 0) + 1;
  sequenceRef.current = nextToken;
  return nextToken;
}

export function isCurrentProjectSelectionLoad(sequenceRef, loadToken) {
  if (!sequenceRef || typeof sequenceRef !== "object") {
    return false;
  }
  return Number(sequenceRef.current || 0) === Number(loadToken || 0);
}
