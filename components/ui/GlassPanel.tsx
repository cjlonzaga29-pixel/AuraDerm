import type { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div
      className={`glass-surface rounded-panel border border-glass-border ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
