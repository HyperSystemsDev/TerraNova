import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useUIStore } from "@/stores/uiStore";

export default function DetachedWindowPortal({ id, children }: { id: string; children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const childWindowRef = useRef<Window | null>(null);
  const detached = useUIStore((s) => s.previewDetachedWindow);
  const setDetached = useUIStore((s) => s.setPreviewDetachedWindow);

  useEffect(() => {
    if (!detached) return;
    // Read previous geometry if any
    let left: number | undefined;
    let top: number | undefined;
    let width: number | undefined;
    let height: number | undefined;
    try {
      const raw = localStorage.getItem(`tn-${id}-window`);
      if (raw) {
        const parsed = JSON.parse(raw);
        left = parsed.left;
        top = parsed.top;
        width = parsed.width;
        height = parsed.height;
      }
    } catch {}

    const features = [] as string[];
    if (width) features.push(`width=${Math.round(width)}`);
    if (height) features.push(`height=${Math.round(height)}`);
    if (left !== undefined && top !== undefined) features.push(`left=${Math.round(left)}`, `top=${Math.round(top)}`);
    features.push("resizable=yes,scrollbars=yes");

    // Open a blank window and render into it
    const w = window.open("", "tn-detached-" + id, features.join(","));
    if (!w) {
      console.warn("Failed to open detached window");
      setDetached(false);
      return;
    }
    childWindowRef.current = w;

    // Basic document skeleton so CSS variables still apply
    try {
      w.document.title = document.title + " - " + (id ?? "Detached");
      const base = document.createElement("base");
      base.href = window.location.href;
      w.document.head.appendChild(base);
      // copy styles
      const styles = Array.from(document.querySelectorAll("link[rel=stylesheet], style"));
      for (const s of styles) {
        w.document.head.appendChild(s.cloneNode(true));
      }
    } catch (e) {
      // ignore
    }

    const container = w.document.createElement("div");
    container.id = `tn-detached-${id}`;
    container.style.width = "100%";
    container.style.height = "100%";
    w.document.body.style.margin = "0";
    w.document.body.appendChild(container);
    containerRef.current = container;

    const saveGeometry = () => {
      try {
        const left = w.screenX ?? (w as any).screenLeft;
        const top = w.screenY ?? (w as any).screenTop;
        const width = w.outerWidth;
        const height = w.outerHeight;
        localStorage.setItem(`tn-${id}-window`, JSON.stringify({ left, top, width, height }));
      } catch {}
    };

    const onBeforeUnload = () => {
      // Save geometry
      saveGeometry();
    };

    w.addEventListener("beforeunload", onBeforeUnload);

    const onCloseInterval = setInterval(() => {
      if (!childWindowRef.current || childWindowRef.current.closed) {
        clearInterval(onCloseInterval);
        // mark detached false in store
        setDetached(false);
      }
    }, 500);

    // Save geometry periodically
    const geomInterval = setInterval(saveGeometry, 1000);

    return () => {
      try {
        clearInterval(onCloseInterval);
        clearInterval(geomInterval);
        w.removeEventListener("beforeunload", onBeforeUnload);
      } catch {}
      try {
        if (!w.closed) w.close();
      } catch {}
      childWindowRef.current = null;
    };
  }, [detached, id, setDetached]);

  if (!detached || !containerRef.current) return null;
  return createPortal(children, containerRef.current);
}

