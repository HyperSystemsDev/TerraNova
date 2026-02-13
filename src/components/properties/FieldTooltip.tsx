import { useState, useRef, useCallback } from "react";

interface FieldTooltipProps {
  description: string;
}

export function FieldTooltip({ description }: FieldTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 200);
  }, []);

  const hideTooltip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  return (
    <span
      className="relative inline-flex items-center ml-1"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded-full border border-tn-border text-[9px] text-tn-text-muted cursor-help select-none leading-none">
        ?
      </span>
      {visible && (
        <div className="absolute left-7 top-1/2 -translate-y-1/2 z-50 min-w-[200px] max-w-[280px] px-3 py-2 text-[11px] leading-relaxed text-tn-text bg-tn-bg border border-tn-border rounded-md shadow-xl whitespace-normal break-words pointer-events-none">
          {/* Arrow — border layer */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-tn-border" />
          {/* Arrow — fill layer */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 ml-px w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-tn-bg" />
          {description}
        </div>
      )}
    </span>
  );
}
