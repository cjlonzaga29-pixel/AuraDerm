type EyebrowProps = {
  children: string;
  withRule?: boolean;
  className?: string;
};

export function Eyebrow({ children, withRule = false, className }: EyebrowProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      {withRule ? <span className="h-px w-8 bg-sage-muted" aria-hidden="true" /> : null}
      <span className="font-sans text-xs uppercase tracking-[0.18em] text-sage-muted">
        {children}
      </span>
    </div>
  );
}
