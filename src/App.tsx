import { useState, useRef, useEffect, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useProjectStore } from "@/stores/projectStore";
import { Toolbar } from "@/components/layout/Toolbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { PanelLayout } from "@/components/layout/PanelLayout";
import { DragGhost } from "@/components/editor/DragGhost";
import { HomeScreen } from "@/components/home/HomeScreen";
import { Toast } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { saveRef } from "@/utils/saveRef";

type PendingAction = "window-close" | "close-project";

export default function App() {
  const projectPath = useProjectStore((s) => s.projectPath);

  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef<PendingAction>("close-project");

  // Bypass flag: when true the onCloseRequested handler lets the close through.
  const forceCloseRef = useRef(false);

  // Tracks whether the dialog is visible. Updated SYNCHRONOUSLY (not via
  // useEffect) so the onCloseRequested handler always reads a fresh value —
  // Cmd+W fires both our keydown handler and Tauri's native close event in
  // the same tick, and a useEffect would still be false at that point.
  const dialogOpenRef = useRef(false);

  /** Show the confirmation dialog (updates both state and ref synchronously). */
  const openDialog = useCallback((action: PendingAction) => {
    pendingRef.current = action;
    dialogOpenRef.current = true;
    setShowDialog(true);
  }, []);

  /** Hide the confirmation dialog. */
  const closeDialog = useCallback(() => {
    dialogOpenRef.current = false;
    setShowDialog(false);
  }, []);

  // ---- Intercept OS window close (X button / Cmd+W native) ----
  useEffect(() => {
    const unlisten = getCurrentWindow().onCloseRequested((event) => {
      // If we set the force-close flag, allow the window to close.
      if (forceCloseRef.current) return;

      // If the dialog is already showing (e.g. keyboard handler got there
      // first via Cmd+W), just prevent the close without touching pendingRef.
      if (dialogOpenRef.current) {
        event.preventDefault();
        return;
      }

      if (useProjectStore.getState().isDirty) {
        event.preventDefault();
        openDialog("window-close");
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [openDialog]);

  // ---- Toolbar: File > Close Project / Ctrl+W ----
  const requestCloseProject = useCallback(() => {
    if (useProjectStore.getState().isDirty) {
      openDialog("close-project");
    } else {
      useProjectStore.getState().closeProject();
    }
  }, [openDialog]);

  // ---- Dialog actions ----
  function executeClose() {
    closeDialog();
    setLoading(false);

    if (pendingRef.current === "window-close") {
      forceCloseRef.current = true;
      getCurrentWindow().close();
    } else {
      useProjectStore.getState().closeProject();
    }
  }

  async function handleSaveAndClose() {
    if (!saveRef.current) {
      executeClose();
      return;
    }
    setLoading(true);
    try {
      await saveRef.current();
      if (!useProjectStore.getState().isDirty) {
        executeClose();
      }
      // If still dirty, save failed — dialog stays open
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    if (!loading) closeDialog();
  }

  // ---- Render ----
  const dialog = (
    <ConfirmDialog
      open={showDialog}
      onClose={dismiss}
      title="Unsaved Changes"
      message="You have unsaved changes. What would you like to do?"
      confirmLabel="Save & Close"
      onConfirm={handleSaveAndClose}
      secondaryLabel="Discard"
      onSecondary={executeClose}
      loading={loading}
    />
  );

  if (projectPath === null) {
    return (
      <>
        <HomeScreen />
        {dialog}
        <Toast />
      </>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-tn-bg text-tn-text">
        <Toolbar onCloseProject={requestCloseProject} />
        <ErrorBoundary>
          <PanelLayout />
        </ErrorBoundary>
        <StatusBar />
      </div>
      <DragGhost />
      <Toast />
      {dialog}
    </ReactFlowProvider>
  );
}
