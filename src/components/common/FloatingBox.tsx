import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useUIStore, DEFAULT_DOCK_ZONE_BY_COMPONENT } from "@/stores/uiStore";
import { getDockZoneElement } from "@/utils/dockRegistry";

type Anchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type FloatingBoxProps = {
  id: string;
  title?: string;
  defaultAnchor?: Anchor;
  children: React.ReactNode;
};

type Position = { x: number; y: number };
type PanelSize = { w?: number; h?: number };
type ResizeDirection = "e" | "s" | "se";

type DragStart = {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  startX: number;
  startY: number;
};

type ResizeStart = {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  startW: number;
  startH: number;
  direction: ResizeDirection;
};

type SizeChangedDetail = { id?: string };
type OpenDockedMenuDetail = { id: string; x: number; y: number };

declare global {
  interface Window {
    __tnZIndexCounter?: number;
  }
}

function isAnchor(value: string | null): value is Anchor {
  return value === "top-left" || value === "top-right" || value === "bottom-left" || value === "bottom-right";
}

function readStoredAnchor(id: string, fallback: Anchor): Anchor | null {
  try {
    const raw = localStorage.getItem(`tn-${id}-anchor`);
    if (raw === null) return fallback;
    return isAnchor(raw) ? raw : null;
  } catch {
    return fallback;
  }
}

function readStoredPosition(id: string): Position | null {
  try {
    const raw = localStorage.getItem(`tn-${id}-pos`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Position>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null;
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}

function readStoredSize(id: string): PanelSize | null {
  try {
    const raw = localStorage.getItem(`tn-${id}-size`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PanelSize>;
    return {
      w: typeof parsed.w === "number" ? parsed.w : undefined,
      h: typeof parsed.h === "number" ? parsed.h : undefined,
    };
  } catch {
    return null;
  }
}

function readStoredMinimized(id: string): boolean {
  try {
    return localStorage.getItem(`tn-${id}-minimized`) === "true";
  } catch {
    return false;
  }
}

function readStoredPinned(id: string): boolean {
  try {
    return localStorage.getItem(`tn-${id}-pinned`) === "true";
  } catch {
    return false;
  }
}

function clampPosition(position: Position, width: number, height: number): Position {
  const margin = 8;
  const viewportW = window.innerWidth || 1024;
  const viewportH = window.innerHeight || 768;
  return {
    x: Math.max(margin, Math.min(position.x, Math.max(margin, viewportW - width - margin))),
    y: Math.max(margin, Math.min(position.y, Math.max(margin, viewportH - height - margin))),
  };
}

function isPrimaryPointerDown(event: React.PointerEvent): boolean {
  if (!event.isPrimary) return false;
  if (event.pointerType === "mouse" && event.button !== 0) return false;
  return true;
}

export function FloatingBox({ id, title, defaultAnchor = "top-right", children }: FloatingBoxProps) {
  const startRef = useRef<DragStart | null>(null);
  const resizeRef = useRef<ResizeStart | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const [size, setSize] = useState<PanelSize | null>(() => readStoredSize(id));
  const [anchor, setAnchor] = useState<Anchor | null>(() => readStoredAnchor(id, defaultAnchor));
  const [minimized, setMinimized] = useState<boolean>(() => readStoredMinimized(id));
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<Position | null>(null);
  const [pinned, setPinned] = useState<boolean>(() => readStoredPinned(id));
  const [zIndex, setZIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isPreviewLocked = id === "preview-panel";
  const movedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<Position | null>(null);
  const pendingPosRef = useRef<Position | null>(null);
  const rafPendingRef = useRef<number | null>(null);

  const dockAssignments = useUIStore((s) => s.dockAssignments);
  const dockZoneActivePanel = useUIStore((s) => s.dockZoneActivePanel);
  const setDockAssignment = useUIStore((s) => s.setDockAssignment);
  const setDockZoneActivePanel = useUIStore((s) => s.setDockZoneActivePanel);
  const setFloatingPanelById = useUIStore((s) => s.setFloatingPanelById);

  const dockZoneId = dockAssignments[id] ?? null;
  const dockEl = dockZoneId ? getDockZoneElement(dockZoneId) : null;
  const activeDockedId = dockZoneId ? dockZoneActivePanel[dockZoneId] ?? null : null;

  // Bring this floating panel to front via global floatingOrder
  const bringToFront = useCallback(() => {
    try {
      useUIStore.getState().bringFloatingToFront(id);
    } catch {
      // fallback to window counter when store not ready
      const next = (window.__tnZIndexCounter ?? 2000) + 1;
      window.__tnZIndexCounter = next;
      setZIndex(next);
      if (containerRef.current) containerRef.current.style.zIndex = String(next);
    }
  }, [id]);

  // Update local zIndex whenever the global floating order changes
  const floatingOrder = useUIStore((s) => s.floatingOrder);
  useEffect(() => {
    try {
      const idx = floatingOrder.indexOf(id);
      if (idx === -1) {
        // not in order => leave as-is
        return;
      }
      // base z-index for floating panels to keep above other UI
      const base = 3000;
      const z = base + idx;
      setZIndex(z);
      if (containerRef.current) containerRef.current.style.zIndex = String(z);
    } catch {
      // ignore
    }
  }, [floatingOrder, id]);

  const avoidOverlap = useCallback((position: Position, rectW: number, rectH: number): Position => {
    try {
      const margin = 8;
      const maxW = window.innerWidth || 1024;
      const maxH = window.innerHeight || 768;
      let nextX = Math.round(position.x);
      let nextY = Math.round(position.y);
      const others = Array.from(document.querySelectorAll<HTMLElement>(".tn-floating-box"));

      const ownRect = () => ({ left: nextX, top: nextY, right: nextX + rectW, bottom: nextY + rectH });

      let attempts = 0;
      while (attempts < 40) {
        let collided = false;
        const mine = ownRect();

        for (const el of others) {
          if (el.dataset.floatingId === id) continue;
          if (el.dataset.dockedId) continue;

          const other = el.getBoundingClientRect();
          const overlaps = !(mine.right + margin <= other.left || mine.left >= other.right + margin || mine.bottom + margin <= other.top || mine.top >= other.bottom + margin);
          if (!overlaps) continue;

          nextX += Math.max(20, Math.round(rectW * 0.1));
          if (nextX + rectW > maxW - margin) {
            nextX = margin;
            nextY += Math.max(20, Math.round(rectH * 0.1));
          }

          collided = true;
          break;
        }

        if (!collided) break;
        attempts += 1;
      }

      nextX = Math.max(margin, Math.min(nextX, maxW - rectW - margin));
      nextY = Math.max(margin, Math.min(nextY, maxH - rectH - margin));
      return { x: nextX, y: nextY };
    } catch {
      return position;
    }
  }, [id]);

  const restoreFromStorage = useCallback(() => {
    setMinimized(readStoredMinimized(id));

    const nextSize = readStoredSize(id);
    setSize(nextSize);

    setAnchor(readStoredAnchor(id, defaultAnchor));

    const storedPos = readStoredPosition(id);
    if (!storedPos) {
      setPos(null);
      posRef.current = null;
      return;
    }

    const rectW = nextSize?.w ?? containerRef.current?.offsetWidth ?? 320;
    const rectH = nextSize?.h ?? containerRef.current?.offsetHeight ?? 240;
    const clamped = clampPosition(storedPos, rectW, rectH);
    const nonOverlapping = avoidOverlap(clamped, rectW, rectH);
    setPos(nonOverlapping);
    posRef.current = nonOverlapping;
  }, [avoidOverlap, defaultAnchor, id]);

  const clampAndSetPos = useCallback((position: Position) => {
    const rectW = size?.w ?? containerRef.current?.offsetWidth ?? 320;
    const rectH = size?.h ?? containerRef.current?.offsetHeight ?? 240;
    const clamped = clampPosition(position, rectW, rectH);
    const nonOverlapping = avoidOverlap(clamped, rectW, rectH);
    setPos(nonOverlapping);
    posRef.current = nonOverlapping;
  }, [avoidOverlap, size?.h, size?.w]);

  const findDockZoneAtPoint = useCallback((x: number, y: number): string | null => {
    const hits = document.elementsFromPoint(x, y);
    for (const el of hits) {
      const zoneId = (el as HTMLElement).dataset?.dockZoneId ?? el.getAttribute("data-dock-zone-id");
      if (zoneId) return zoneId;
    }
    return null;
  }, []);

  const dockToZone = useCallback((zoneId: string) => {
    setDockAssignment(id, zoneId);
    setDockZoneActivePanel(zoneId, id);
    setFloatingPanelById(id, false);
  }, [id, setDockAssignment, setDockZoneActivePanel, setFloatingPanelById]);

  const undockPanel = useCallback(() => {
    setDockAssignment(id, null);
    setFloatingPanelById(id, true);
  }, [id, setDockAssignment, setFloatingPanelById]);

  const maybeDockAtPosition = useCallback((position: Position): boolean => {
    const width = size?.w ?? containerRef.current?.offsetWidth ?? 320;
    const height = size?.h ?? containerRef.current?.offsetHeight ?? 240;
    const centerX = Math.round(position.x + width / 2);
    const centerY = Math.round(position.y + height / 2);
    const foundZone = findDockZoneAtPoint(centerX, centerY);
    if (!foundZone) return false;
    dockToZone(foundZone);
    return true;
  }, [dockToZone, findDockZoneAtPoint, size?.h, size?.w]);

  const handleSnapBack = useCallback((position: Position): boolean => {
    const ui = useUIStore.getState();
    if (!ui.snapBackEnabled) return false;

    const edgeThreshold = Number(ui.snapEdgeThreshold ?? 80);
    const safeThreshold = Number.isFinite(edgeThreshold) ? edgeThreshold : 80;

    const viewportW = window.innerWidth || 1024;
    const nearLeft = position.x < safeThreshold;
    const nearRight = position.x > viewportW - safeThreshold;
    const nearTop = position.y < safeThreshold;

    if (!nearLeft && !nearRight && !nearTop) return false;

    if (maybeDockAtPosition(position)) return true;

    const defaultZone = DEFAULT_DOCK_ZONE_BY_COMPONENT[id];
    if (defaultZone) {
      dockToZone(defaultZone);
      return true;
    }

    setFloatingPanelById(id, false);
    return true;
  }, [dockToZone, id, maybeDockAtPosition, setFloatingPanelById]);

  const beginDrag = useCallback((pointerId: number, pointerX: number, pointerY: number, startX: number, startY: number) => {
    movedRef.current = false;
    setAnchor(null);
    setDragging(true);
    setResizing(false);
    startRef.current = { pointerId, pointerX, pointerY, startX, startY };
    try {
      document.body.style.userSelect = "none";
    } catch {
      // ignore
    }
  }, []);

  const beginResize = useCallback((pointerId: number, pointerX: number, pointerY: number, direction: ResizeDirection) => {
    const width = size?.w ?? containerRef.current?.offsetWidth ?? 320;
    const height = size?.h ?? containerRef.current?.offsetHeight ?? 240;
    setResizing(true);
    setDragging(false);
    resizeRef.current = {
      pointerId,
      pointerX,
      pointerY,
      startW: width,
      startH: height,
      direction,
    };
    try {
      document.body.style.userSelect = "none";
    } catch {
      // ignore
    }
  }, [size?.h, size?.w]);

  useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);

  // Ensure floating editor canvas has a reasonable default size when first opened
  // without a stored size. Without an explicit size, children using 100% height
  // (like React Flow's container) may collapse to zero height.
  useEffect(() => {
    if (id === "editor-canvas" && !dockZoneId && !size) {
      // Default to a landscape panel suitable for the graph
      setSize({ w: 960, h: 520 });
    }
  }, [id, dockZoneId, size]);

  useEffect(() => {
    const onWorkspaceLoaded = () => {
      restoreFromStorage();
    };

    window.addEventListener("tn-workspace-loaded", onWorkspaceLoaded as EventListener);
    return () => window.removeEventListener("tn-workspace-loaded", onWorkspaceLoaded as EventListener);
  }, [restoreFromStorage]);

  useEffect(() => {
    const onSizeChanged = (event: Event) => {
      const detail = (event as CustomEvent<SizeChangedDetail>).detail;
      const changedId = detail?.id;
      if (changedId && changedId !== id) return;
      setSize(readStoredSize(id));
    };

    window.addEventListener("tn-size-changed", onSizeChanged as EventListener);
    return () => window.removeEventListener("tn-size-changed", onSizeChanged as EventListener);
  }, [id]);

  useEffect(() => {
    const onOpenDockedMenu = (event: Event) => {
      const detail = (event as CustomEvent<OpenDockedMenuDetail>).detail;
      if (!detail || detail.id !== id) return;
      bringToFront();
      setMenuPos({ x: detail.x, y: detail.y });
      setMenuVisible(true);
    };

    window.addEventListener("tn-open-docked-menu", onOpenDockedMenu as EventListener);
    return () => window.removeEventListener("tn-open-docked-menu", onOpenDockedMenu as EventListener);
  }, [bringToFront, id]);

  useEffect(() => {
    if (anchor) {
      try {
        localStorage.setItem(`tn-${id}-anchor`, anchor);
      } catch {
        // ignore
      }
      return;
    }

    try {
      localStorage.removeItem(`tn-${id}-anchor`);
    } catch {
      // ignore
    }
  }, [anchor, id]);

  useEffect(() => {
    if (!pos) return;
    if (dragging || resizing) return;
    try {
      localStorage.setItem(`tn-${id}-pos`, JSON.stringify(pos));
    } catch {
      // ignore
    }
  }, [dragging, id, pos, resizing]);

  useEffect(() => {
    try {
      localStorage.setItem(`tn-${id}-pinned`, pinned ? "true" : "false");
    } catch {
      // ignore
    }
  }, [id, pinned]);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    try {
      localStorage.setItem(`tn-${id}-minimized`, minimized ? "true" : "false");
    } catch {
      // ignore
    }
  }, [id, minimized]);

  useEffect(() => {
    try {
      if (size) localStorage.setItem(`tn-${id}-size`, JSON.stringify(size));
      else localStorage.removeItem(`tn-${id}-size`);
    } catch {
      // ignore
    }
  }, [id, size]);

  useEffect(() => {
    if (anchor) return;

    const clampToViewport = () => {
      const currentPos = posRef.current;
      if (!currentPos) return;

      const width = size?.w ?? containerRef.current?.offsetWidth ?? 320;
      const height = size?.h ?? containerRef.current?.offsetHeight ?? 240;
      const clamped = clampPosition(currentPos, width, height);
      if (clamped.x === currentPos.x && clamped.y === currentPos.y) return;

      setPos(clamped);
      posRef.current = clamped;
    };

    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [anchor, size?.h, size?.w]);

  useEffect(() => {
    if (!menuVisible) return;

    menuRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMenuVisible(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuVisible]);

  const togglePin = useCallback((event?: React.MouseEvent) => {
    event?.stopPropagation();
    setPinned((p) => !p);
  }, []);

  const resetPosition = useCallback((event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      localStorage.removeItem(`tn-${id}-pos`);
      localStorage.removeItem(`tn-${id}-size`);
      localStorage.removeItem(`tn-${id}-anchor`);
      localStorage.removeItem(`tn-${id}-minimized`);
    } catch {
      // ignore
    }
    // restore defaults
    restoreFromStorage();
    window.dispatchEvent(new CustomEvent("tn-size-changed", { detail: { id } }));
  }, [id, restoreFromStorage]);

  useEffect(() => {
    if (!dragging && !resizing) return;

    const onPointerMove = (event: PointerEvent) => {
      const resizeState = resizeRef.current;
      if (resizeState && event.pointerId === resizeState.pointerId) {
        const dx = event.clientX - resizeState.pointerX;
        const dy = event.clientY - resizeState.pointerY;

        const widthDelta = resizeState.direction.includes("e") ? dx : 0;
        const heightDelta = resizeState.direction.includes("s") ? dy : 0;

        const nextWidth = Math.max(160, resizeState.startW + widthDelta);
        const nextHeight = Math.max(80, resizeState.startH + heightDelta);

        setSize({ w: Math.round(nextWidth), h: Math.round(nextHeight) });
        return;
      }

      const dragState = startRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      const dx = event.clientX - dragState.pointerX;
      const dy = event.clientY - dragState.pointerY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;

      const nextPos = { x: dragState.startX + dx, y: dragState.startY + dy };
      pendingPosRef.current = nextPos;

      if (rafPendingRef.current !== null) return;
      rafPendingRef.current = requestAnimationFrame(() => {
        rafPendingRef.current = null;
        const pending = pendingPosRef.current;
        if (!pending) return;
        clampAndSetPos(pending);
        pendingPosRef.current = null;
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      const resizeState = resizeRef.current;
      if (resizeState && event.pointerId === resizeState.pointerId) {
        resizeRef.current = null;
        setResizing(false);
        try {
          document.body.style.userSelect = "";
        } catch {
          // ignore
        }
        return;
      }

      const dragState = startRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      setDragging(false);
      startRef.current = null;
      setAnchor(null);

      try {
        document.body.style.userSelect = "";
      } catch {
        // ignore
      }

      const releasedPos = posRef.current;
      if (!releasedPos || isPreviewLocked) return;

      if (handleSnapBack(releasedPos)) return;
      if (!movedRef.current) return;

      maybeDockAtPosition(releasedPos);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      if (rafPendingRef.current !== null) {
        cancelAnimationFrame(rafPendingRef.current);
        rafPendingRef.current = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [dragging, handleSnapBack, isPreviewLocked, maybeDockAtPosition, resizing]);

  const anchoredClass =
    anchor === "top-left"
      ? "top-4 left-4"
      : anchor === "top-right"
      ? "top-4 right-4"
      : anchor === "bottom-left"
      ? "bottom-4 left-4"
      : anchor === "bottom-right"
      ? "bottom-4 right-4"
      : "";

  const style: React.CSSProperties = pos && !anchor ? { left: 0, top: 0, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` } : { pointerEvents: "auto" };
  const dimensionStyle: React.CSSProperties = size
    ? { width: size.w ? `${size.w}px` : undefined, height: size.h ? `${size.h}px` : undefined }
    : {};

  const sizeStyleClass = size ? "" : " max-w-xs";
  const containerClass = `absolute z-20 bg-tn-panel/90 rounded text-sm text-tn-text-muted ${anchoredClass}${minimized ? " px-2 py-1" : ` p-2${sizeStyleClass}`}`;

  const dockPanelFromMenu = () => {
    setMenuVisible(false);

    const defaultZone = dockZoneId ?? DEFAULT_DOCK_ZONE_BY_COMPONENT[id] ?? null;
    if (!defaultZone) {
      setFloatingPanelById(id, false);
      return;
    }

    dockToZone(defaultZone);
  };

  const closePanelFromMenu = () => {
    setMenuVisible(false);
    setDockAssignment(id, null);
    setMinimized(true);
  };

  if (dockZoneId && dockEl) {
    const hiddenInDock = !!activeDockedId && activeDockedId !== id;
    const minimalDockFrame = id === "toolbar";

    const onUndock = (event?: React.MouseEvent) => {
      event?.stopPropagation();
      undockPanel();
    };

    return createPortal(
      <div
        data-docked-id={id}
        hidden={hiddenInDock}
        className={`tn-docked-item mb-2 ${minimalDockFrame ? "" : "bg-tn-panel/80 rounded p-1"}`}
        onContextMenu={(event) => {
          event.preventDefault();
          setDockZoneActivePanel(dockZoneId, id);
          bringToFront();
          setMenuPos({ x: event.clientX, y: event.clientY });
          setMenuVisible(true);
        }}
        onPointerDown={() => setDockZoneActivePanel(dockZoneId, id)}
      >
        {!minimalDockFrame ? (
          <div className="flex items-center justify-between mb-1">
            <div
              className="text-xs text-tn-text-muted cursor-grab"
              onPointerDown={(event) => {
                if (!isPrimaryPointerDown(event) || isPreviewLocked) return;

                event.stopPropagation();
                event.preventDefault();

                setDockZoneActivePanel(dockZoneId, id);
                bringToFront();
                undockPanel();

                const startX = posRef.current?.x ?? event.clientX - 100;
                const startY = posRef.current?.y ?? event.clientY - 40;

                clampAndSetPos({ x: startX, y: startY });
                beginDrag(event.pointerId, event.clientX, event.clientY, startX, startY);
              }}
            >
              {title ?? id}
            </div>

            <div className="flex gap-1">
              <button className="text-xs px-2 py-0.5 bg-tn-panel-darker rounded" onClick={onUndock} title="Undock">
                U
              </button>
            </div>
          </div>
        ) : null}

        <div>{children}</div>

        {menuVisible && menuPos ? (
          <div style={{ position: "fixed", left: menuPos.x, top: menuPos.y, zIndex: 9999 }} onMouseLeave={() => setMenuVisible(false)}>
            <div ref={menuRef} role="menu" aria-label={`${title ?? id} menu`} tabIndex={-1} className="bg-tn-panel p-1 rounded shadow-lg text-xs">
              <button type="button" role="menuitem" className="w-full text-left px-2 py-1 hover:bg-white/5 rounded cursor-pointer" onClick={() => {
                setMenuVisible(false);
                onUndock();
              }}>
                Detach / Undock
              </button>
              <button type="button" role="menuitem" className="w-full text-left px-2 py-1 hover:bg-white/5 rounded cursor-pointer" onClick={togglePin}>
                {pinned ? "Unpin" : "Pin"}
              </button>
              <button type="button" role="menuitem" className="w-full text-left px-2 py-1 hover:bg-white/5 rounded cursor-pointer" onClick={resetPosition}>
                Reset position
              </button>
              <button type="button" role="menuitem" className="w-full text-left px-2 py-1 hover:bg-white/5 rounded cursor-pointer" onClick={closePanelFromMenu}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>,
      dockEl,
    );
  }

  return (
    <div
      className={`tn-floating-box ${containerClass}`}
      data-floating-id={id}
      ref={containerRef}
      style={{
        ...style,
        ...dimensionStyle,
        zIndex: zIndex ?? undefined,
        cursor: isPreviewLocked ? "default" : dragging ? "grabbing" : "grab",
        userSelect: dragging || resizing ? "none" : undefined,
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        bringToFront();
        setMenuPos({ x: event.clientX, y: event.clientY });
        setMenuVisible(true);
      }}
      onPointerDown={(event) => {
        if (!isPrimaryPointerDown(event)) return;

        bringToFront();

        const target = event.target as HTMLElement;
        const interactiveTarget = target.closest("input,button,textarea,select,option,[contenteditable='true']");
        if (interactiveTarget) return;

        if (isPreviewLocked) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
          beginDrag(event.pointerId, event.clientX, event.clientY, pos?.x ?? 100, pos?.y ?? 80);
          return;
        }

        const threshold = 10;
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        const onRightEdge = offsetX >= rect.width - threshold;
        const onBottomEdge = offsetY >= rect.height - threshold;

        event.preventDefault();

        if (onRightEdge || onBottomEdge) {
          const direction: ResizeDirection = onRightEdge && onBottomEdge ? "se" : onRightEdge ? "e" : "s";
          beginResize(event.pointerId, event.clientX, event.clientY, direction);
          return;
        }

        beginDrag(event.pointerId, event.clientX, event.clientY, pos?.x ?? 100, pos?.y ?? 80);
      }}
    >
      <div className="relative">
        <div data-drag-handle className="-mx-2 -mt-2 mb-2 h-6 flex items-center px-2 cursor-grab select-none">
          <div className="w-6 h-1 rounded bg-white/10 mr-2" />
          <div className="text-xs text-tn-text-muted truncate">
            {title ?? id.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ")}
            {pinned ? <span className="ml-1 text-tn-accent" title="Pinned"> 📌</span> : null}
          </div>
        </div>

        <div
          data-resize-handle
          onPointerDown={(event) => {
            if (!isPrimaryPointerDown(event) || isPreviewLocked) return;
            event.stopPropagation();
            event.preventDefault();
            beginResize(event.pointerId, event.clientX, event.clientY, "e");
          }}
          className="absolute top-0 right-0 h-full w-2 cursor-ew-resize"
        />

        <div
          data-resize-handle
          onPointerDown={(event) => {
            if (!isPrimaryPointerDown(event) || isPreviewLocked) return;
            event.stopPropagation();
            event.preventDefault();
            beginResize(event.pointerId, event.clientX, event.clientY, "s");
          }}
          className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize"
        />

        <div
          data-resize-handle
          onPointerDown={(event) => {
            if (!isPrimaryPointerDown(event) || isPreviewLocked) return;
            event.stopPropagation();
            event.preventDefault();
            beginResize(event.pointerId, event.clientX, event.clientY, "se");
          }}
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
        />

        <div className="absolute top-1 right-1 flex gap-1">
          {!isPreviewLocked && (
            <button
              title="Dock back"
              className="w-6 h-6 rounded bg-tn-panel-darker flex items-center justify-center text-xs"
              onClick={(event) => {
                event.stopPropagation();
                dockPanelFromMenu();
              }}
            >
              D
            </button>
          )}

          <button
            title={minimized ? "Restore" : "Minimize"}
            className="w-6 h-6 rounded bg-tn-panel-darker flex items-center justify-center text-xs"
            onClick={(event) => {
              event.stopPropagation();
              setMinimized((value) => !value);
            }}
          >
            {minimized ? "+" : "-"}
          </button>
        </div>

        {menuVisible && menuPos ? (
          <div style={{ position: "fixed", left: menuPos.x, top: menuPos.y, zIndex: 9999 }} onMouseLeave={() => setMenuVisible(false)}>
            <div ref={menuRef} role="menu" aria-label={`${title ?? id} menu`} tabIndex={-1} className="bg-tn-panel p-1 rounded shadow-lg text-xs">
              <button type="button" role="menuitem" className="w-full text-left px-2 py-1 hover:bg-white/5 rounded cursor-pointer" onClick={dockPanelFromMenu}>
                Dock
              </button>
              <button type="button" role="menuitem" className="w-full text-left px-2 py-1 hover:bg-white/5 rounded cursor-pointer" onClick={() => {
                setMenuVisible(false);
                undockPanel();
              }}>
                Detach / Undock
              </button>
              <button type="button" role="menuitem" className="w-full text-left px-2 py-1 hover:bg-white/5 rounded cursor-pointer" onClick={togglePin}>
                {pinned ? "Unpin" : "Pin"}
              </button>
              <button type="button" role="menuitem" className="w-full text-left px-2 py-1 hover:bg-white/5 rounded cursor-pointer" onClick={resetPosition}>
                Reset position
              </button>
              <button type="button" role="menuitem" className="w-full text-left px-2 py-1 hover:bg-white/5 rounded cursor-pointer" onClick={closePanelFromMenu}>
                Close
              </button>
            </div>
          </div>
        ) : null}

        {!minimized ? children : <div className="text-xs text-tn-text-muted flex items-center gap-1 cursor-default">{id}</div>}
      </div>
    </div>
  );
}

export default FloatingBox;
