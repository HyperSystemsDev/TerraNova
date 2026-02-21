import { useState, useRef, useEffect, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion } from "@tauri-apps/api/app";
import { useProjectStore } from "@/stores/projectStore";
import { SimpleTitleBar } from "@/components/layout/TitleBar";
import { ProjectTitleBar } from "@/components/layout/ProjectTitleBar";
import { StatusBar } from "@/components/layout/StatusBar";
import { PanelLayout } from "@/components/layout/PanelLayout";
import { DragGhost } from "@/components/editor/DragGhost";
import { HomeScreen } from "@/components/home/HomeScreen";
import { Toast } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { NewProjectDialog } from "@/components/dialogs/NewProjectDialog";
import { SettingsDialog } from "@/components/dialogs/SettingsDialog";
import { KeyboardShortcutsDialog } from "@/components/dialogs/KeyboardShortcutsDialog";
import { ConfigurationDialog } from "@/components/dialogs/ConfigurationDialog";
import { ExportSvgDialog } from "@/components/dialogs/ExportSvgDialog";
import { saveRef } from "@/utils/saveRef";
import { isMac } from "@/utils/platform";
import { checkForUpdates } from "@/utils/updater";
import { useSettingsStore } from "@/stores/settingsStore";
import { useToastStore } from "@/stores/toastStore";
import type { SvgExportOptions } from "@/utils/exportSvg";
import { useReactFlow } from "@xyflow/react";
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";
import DetachedWindowPortal from "@/components/common/DetachedWindowPortal";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { startVisualsShallowWatcher } from "@/preview/visualsShallowEvaluator";

type PendingAction = "window-close" | "close-project";

export default function App() {
  const projectPath = useProjectStore((s) => s.projectPath);

  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef<PendingAction>("close-project");

  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showExportSvg, setShowExportSvg] = useState(false);

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

  // ---- Disable native decorations on non-macOS (macOS keeps native traffic lights) ----
  useEffect(() => {
    if (!isMac) {
      getCurrentWindow().setDecorations(false);
    }
  }, []);

  // ---- Post-update verification + auto-check for updates ----
  useEffect(() => {
    const updateTarget = localStorage.getItem("tn-update-target");
    if (updateTarget) {
      localStorage.removeItem("tn-update-target");
      getVersion().then((currentVersion) => {
        if (currentVersion === updateTarget) {
          useToastStore.getState().addToast(`Updated to v${currentVersion}`, "success");
        } else {
          useToastStore.getState().addToast(
            `Update to v${updateTarget} may not have applied (running v${currentVersion})`,
            "error",
          );
        }
      });
      return; // Skip auto-update check this launch
    }

    if (!useSettingsStore.getState().autoCheckUpdates) return;
    const timer = setTimeout(checkForUpdates, 3000);
    return () => clearTimeout(timer);
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
      <div className="flex flex-col h-screen bg-tn-bg text-tn-text">
        <SimpleTitleBar />
        <HomeScreen />
        {dialog}
        <Toast />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <ProjectEditor
        requestCloseProject={requestCloseProject}
        showNewProject={showNewProject}
        setShowNewProject={setShowNewProject}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
        showConfig={showConfig}
        setShowConfig={setShowConfig}
        showExportSvg={showExportSvg}
        setShowExportSvg={setShowExportSvg}
        dialog={dialog}
      />
    </ReactFlowProvider>
  );
}

function ProjectEditor({
  requestCloseProject,
  showNewProject,
  setShowNewProject,
  showSettings,
  setShowSettings,
  showShortcuts,
  setShowShortcuts,
  showConfig,
  setShowConfig,
  showExportSvg,
  setShowExportSvg,
  dialog,
}: {
  requestCloseProject: () => void;
  showNewProject: boolean;
  setShowNewProject: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  showConfig: boolean;
  setShowConfig: (show: boolean) => void;
  showExportSvg: boolean;
  setShowExportSvg: (show: boolean) => void;
  dialog: React.ReactNode;
}) {
  // Wire up global keyboard shortcuts
  useGlobalKeyboardShortcuts({
    onCloseProject: requestCloseProject,
    onNewProject: () => setShowNewProject(true),
    onSettings: () => setShowSettings(true),
    onExportSvg: () => setShowExportSvg(true),
  });

  useEffect(() => {
    return startVisualsShallowWatcher();
  }, []);

  return (
    <>
      <div className="flex flex-col h-screen bg-tn-bg text-tn-text">
        <ProjectTitleBar
          onCloseProject={requestCloseProject}
          onNewProject={() => setShowNewProject(true)}
          onSettings={() => setShowSettings(true)}
          onShortcuts={() => setShowShortcuts(true)}
          onConfig={() => setShowConfig(true)}
          onExportSvg={() => setShowExportSvg(true)}
        />
        <ErrorBoundary>
          <PanelLayout />
        </ErrorBoundary>
        <StatusBar />
      </div>
        {/* Handle tab drops onto dock zones globally: attach once per editor mount */}
        <GlobalTabDropHandler />
      <DragGhost />
      <DetachedWindowPortal id="preview-panel">
        <PreviewPanel />
      </DetachedWindowPortal>
      <Toast />
      {dialog}
      <NewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} />
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
      <KeyboardShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ConfigurationDialog open={showConfig} onClose={() => setShowConfig(false)} />
      <ExportSvgDialogWrapper open={showExportSvg} onClose={() => setShowExportSvg(false)} />
    </>
  );
}

function GlobalTabDropHandler() {
  const setDockAssignment = useUIStore((s) => s.setDockAssignment);
  const setFloatingPanelById = useUIStore((s) => s.setFloatingPanelById);
  const setDockZoneActivePanel = useUIStore((s) => s.setDockZoneActivePanel);

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent;
        const detail = ce.detail as { zoneId?: string | null; key?: string | null } | undefined;
        if (!detail) return;
        const zoneId = detail.zoneId ?? null;
        const key = detail.key ?? null;
        if (!key) return;
        // assign dock, make sure it's not floating, and set active panel
        try { setDockAssignment(key, zoneId); } catch {}
        try { setFloatingPanelById(key, false); } catch {}
        if (zoneId) try { setDockZoneActivePanel(zoneId, key); } catch {}
      } catch {}
    };

    window.addEventListener("tn-tab-dropped-on-zone", handler as EventListener);
    return () => window.removeEventListener("tn-tab-dropped-on-zone", handler as EventListener);
  }, [setDockAssignment, setFloatingPanelById, setDockZoneActivePanel]);

  return null;
}

function ExportSvgDialogWrapper({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reactFlow = useReactFlow();

  async function handleExportSvg(options: SvgExportOptions) {
    try {
      const { generateSvg, writeSvgToFile } = await import("@/utils/exportSvg");
      const svgString = generateSvg(reactFlow, options);
      await writeSvgToFile(svgString);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Export SVG failed:", err);
      useToastStore.getState().addToast("Export SVG failed", "error");
    }
  }

  return <ExportSvgDialog open={open} onClose={onClose} onExport={handleExportSvg} />;
}
