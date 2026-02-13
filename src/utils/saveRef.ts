/**
 * Module-level ref that bridges `useTauriIO().saveFile` (available inside
 * ReactFlowProvider) to code that renders *above* the provider (App.tsx).
 *
 * Toolbar sets `saveRef.current = saveFile` on mount; App reads it when
 * the user chooses "Save & Close" in the unsaved-changes dialog.
 */
export const saveRef: { current: (() => Promise<void>) | null } = { current: null };
