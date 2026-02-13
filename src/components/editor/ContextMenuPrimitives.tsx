import { useEffect, useRef, type ReactNode } from "react";

interface ContextMenuOverlayProps {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}

export function ContextMenuOverlay({ x, y, onClose, children }: ContextMenuOverlayProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Clamp position to viewport
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      el.style.left = `${window.innerWidth - rect.width - 8}px`;
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = `${window.innerHeight - rect.height - 8}px`;
    }
  }, [x, y]);

  // Close on Escape, scroll, or resize
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClose() {
      onClose();
    }
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleClose);
    window.addEventListener("scroll", handleClose, true);
    return () => {
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("scroll", handleClose, true);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100]" onMouseDown={onClose} onContextMenu={(e) => e.preventDefault()}>
      <div
        ref={menuRef}
        className="absolute bg-tn-surface border border-tn-border rounded-lg shadow-xl py-1 min-w-[180px] text-[12px]"
        style={{ left: x, top: y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface ContextMenuItemProps {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function ContextMenuItem({ label, shortcut, disabled, onClick }: ContextMenuItemProps) {
  return (
    <button
      className={`w-full text-left px-3 py-1.5 flex justify-between gap-4 ${
        disabled
          ? "text-tn-text-muted/40 cursor-default"
          : "text-tn-text hover:bg-tn-accent/20"
      }`}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
    >
      <span>{label}</span>
      {shortcut && <span className="text-tn-text-muted text-[10px]">{shortcut}</span>}
    </button>
  );
}

export function ContextMenuSeparator() {
  return <div className="border-t border-tn-border my-1" />;
}
