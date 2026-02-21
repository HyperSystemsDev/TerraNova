import { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { registerDockZone } from "@/utils/dockRegistry";

type DockZoneProps = {
  id: string;
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

function toLabel(id: string): string {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function DockZone({ id, title, children, className }: DockZoneProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dockZoneActivePanel = useUIStore((s) => s.dockZoneActivePanel);
  const setDockZoneActivePanel = useUIStore((s) => s.setDockZoneActivePanel);
  const [dockedIds, setDockedIds] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(false);
  const [zoneRect, setZoneRect] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const activeId = dockZoneActivePanel[id] ?? null;

  useEffect(() => {
    registerDockZone(id, ref.current);
    return () => registerDockZone(id, null);
  }, [id]);

  useEffect(() => {
    const refreshDockedIds = () => {
      const zoneElement = ref.current;
      if (!zoneElement) {
        setDockedIds([]);
        return;
      }

      const ids = Array.from(zoneElement.querySelectorAll<HTMLElement>(".tn-docked-item[data-docked-id]"))
        .map((element) => element.dataset.dockedId ?? "")
        .filter((panelId): panelId is string => panelId.length > 0);
      setDockedIds(ids);
    };

    refreshDockedIds();

    // track size so we can avoid rendering placeholders in very small zones
    const cur = ref.current;
    if (cur) {
      const ro = new ResizeObserver(() => {
        const r = cur.getBoundingClientRect();
        setZoneRect({ width: Math.round(r.width), height: Math.round(r.height) });
      });
      ro.observe(cur);
      // initialize
      const r = cur.getBoundingClientRect();
      setZoneRect({ width: Math.round(r.width), height: Math.round(r.height) });
      // store observer to disconnect later
      (refreshDockedIds as any)._ro = ro;
    }

    const observer = new MutationObserver(refreshDockedIds);
    const zoneElement = ref.current;
    if (!zoneElement) return () => {};
    observer.observe(zoneElement, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      const ro = (refreshDockedIds as any)._ro as ResizeObserver | undefined;
      ro && ro.disconnect();
    };
  }, []);

  // Highlighting for tab drag-and-drop onto dock zones
  useEffect(() => {
    const onGlobalDragStart = () => setHighlight(true);
    const onGlobalDragEnd = () => setHighlight(false);

    const zoneEl = ref.current;
    if (!zoneEl) return;

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setHighlight(true);
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      // indicate allowed drop
      try { e.dataTransfer!.dropEffect = "move"; } catch {}
      setHighlight(true);
    };

    const onDragLeave = () => setHighlight(false);

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setHighlight(false);
      // forward the dropped tab key so parent can handle docking
      try {
        const key = e.dataTransfer?.getData("text/plain");
        window.dispatchEvent(new CustomEvent("tn-tab-dropped-on-zone", { detail: { zoneId: id, key, x: (e as DragEvent).clientX, y: (e as DragEvent).clientY } }));
      } catch {}
    };

    window.addEventListener("tn-tab-dragstart", onGlobalDragStart);
    window.addEventListener("tn-tab-dragend", onGlobalDragEnd);

    zoneEl.addEventListener("dragenter", onDragEnter as EventListener);
    zoneEl.addEventListener("dragover", onDragOver as EventListener);
    zoneEl.addEventListener("dragleave", onDragLeave as EventListener);
    zoneEl.addEventListener("drop", onDrop as EventListener);

    return () => {
      window.removeEventListener("tn-tab-dragstart", onGlobalDragStart);
      window.removeEventListener("tn-tab-dragend", onGlobalDragEnd);
      zoneEl.removeEventListener("dragenter", onDragEnter as EventListener);
      zoneEl.removeEventListener("dragover", onDragOver as EventListener);
      zoneEl.removeEventListener("dragleave", onDragLeave as EventListener);
      zoneEl.removeEventListener("drop", onDrop as EventListener);
    };
  }, [id]);

  useEffect(() => {
    if (dockedIds.length === 0) {
      if (activeId) setDockZoneActivePanel(id, null);
      return;
    }

    if (!activeId || !dockedIds.includes(activeId)) {
      setDockZoneActivePanel(id, dockedIds[0]);
    }
  }, [activeId, dockedIds, id, setDockZoneActivePanel]);

  return (
    <div ref={ref} data-dock-zone-id={id} className={`tn-dock-zone ${highlight ? "tn-dock-zone--highlight" : ""} ${className ?? ""}`}>
      {title ? <div className="tn-dock-zone-title text-xs text-tn-text-muted mb-1">{title}</div> : null}

      {dockedIds.length > 1 ? (
        <div className="flex gap-1 mb-2">
          {dockedIds.map((panelId) => {
            const isActive = panelId === (activeId ?? dockedIds[0]);
            return (
              <button
                key={panelId}
                onClick={() => setDockZoneActivePanel(id, panelId)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setDockZoneActivePanel(id, panelId);
                  window.dispatchEvent(
                    new CustomEvent("tn-open-docked-menu", {
                      detail: { id: panelId, x: event.clientX, y: event.clientY },
                    }),
                  );
                }}
                className={`px-2 py-0.5 text-xs rounded ${isActive ? "bg-tn-panel-darker" : "bg-tn-panel/60 hover:bg-tn-panel-darker"}`}
              >
                {toLabel(panelId)}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* If the dock zone is empty, show a compact placeholder to avoid large empty gaps */}
      {dockedIds.length === 0 && (!children || (Array.isArray(children) ? children.length === 0 : false)) && zoneRect.width > 120 && zoneRect.height > 28 ? (
        <div className={`tn-dock-zone-empty flex items-center justify-center text-xs text-tn-text-muted py-2 ${highlight ? "tn-dock-zone-empty--highlight" : ""}`}>
          <div className="px-3 py-1 border border-dashed rounded text-[12px] flex items-center gap-2">
            {highlight ? (
              <>
                <svg className="w-4 h-4 text-tn-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="sr-only">Drop here</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-tn-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="6" cy="6" r="1" />
                  <circle cx="12" cy="6" r="1" />
                  <circle cx="18" cy="6" r="1" />
                </svg>
                <span className="sr-only">Drag panels here</span>
              </>
            )}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
