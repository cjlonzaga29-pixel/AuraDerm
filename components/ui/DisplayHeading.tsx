type HeadingLevel = "h1" | "h2" | "h3";

type DisplayHeadingProps = {
  children: string;
  accent?: string;
  level: HeadingLevel;
  className?: string;
};

// P3-P15: headings moved from condensed all-caps Bebas to light Jost in
// sentence case so type sits quietly over the footage. Bebas is kept only for
// the AURADERM wordmark.
const sizeClasses: Record<HeadingLevel, string> = {
  h1: "text-[clamp(2.5rem,5.4vw,4.5rem)] font-light leading-[1.04] tracking-[-0.02em]",
  h2: "text-[clamp(1.875rem,3.4vw,2.75rem)] font-light leading-[1.12] tracking-[-0.015em]",
  h3: "text-lg font-normal leading-snug tracking-[-0.005em]",
};

function renderWithAccent(text: string, accent?: string) {
  if (!accent) return text;
  const index = text.indexOf(accent);
  if (index === -1) return text;
  const before = text.slice(0, index);
  const after = text.slice(index + accent.length);
  return (
    <>
      {before}
      <span className="text-gold">{accent}</span>
      {after}
    </>
  );
}

export function DisplayHeading({ children, accent, level, className }: DisplayHeadingProps) {
  const Tag = level;
  return (
    <Tag
      className={`font-sans text-cream min-w-0 text-balance break-words ${sizeClasses[level]} ${className ?? ""}`}
    >
      {renderWithAccent(children, accent)}
    </Tag>
  );
}
