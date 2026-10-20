import type { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  /** "veil" is the denser tint used as localized backing for copy that sits
   *  over the sunlit falls; "clear" is the default content-panel glass. */
  tone?: "clear" | "veil";
};

export function GlassPanel({ children, className, tone = "clear" }: GlassPanelProps) {
  return (
    <div
      className={`glass-surface ${tone === "veil" ? "glass-veil" : ""} glass-text rounded-panel border border-glass-border ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
