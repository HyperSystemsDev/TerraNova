import { useCallback, useRef } from "react";

/**
 * Reusable debounced change handler for config-level fields.
 * Batches rapid edits into a single undo/redo snapshot.
 */
export function useFieldChange(
  commitState: (label: string) => void,
  setDirty: (dirty: boolean) => void,
  debounceMs = 300,
) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingRef = useRef(false);
  const lastLabelRef = useRef("");

  const debouncedChange = useCallback(
    (label: string, applyFn: () => void) => {
      applyFn();
      setDirty(true);
      hasPendingRef.current = true;
      lastLabelRef.current = label;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        commitState(lastLabelRef.current);
        hasPendingRef.current = false;
        debounceTimerRef.current = null;
      }, debounceMs);
    },
    [commitState, setDirty, debounceMs],
  );

  const flush = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (hasPendingRef.current) {
      commitState(lastLabelRef.current);
      hasPendingRef.current = false;
    }
  }, [commitState]);

  return { debouncedChange, flush };
}
