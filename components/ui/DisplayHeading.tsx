type HeadingLevel = "h1" | "h2" | "h3";

type DisplayHeadingProps = {
  children: string;
  accent?: string;
  level: HeadingLevel;
  className?: string;
};

// P3-P16: headings set in Cormorant Garamond 500 (font-heading) for a more
// distinctive editorial voice; body, nav and buttons stay in Jost. Bebas is
// kept only for the AURADERM wordmark. The h1 scale steps up at lg, where the
// hero copy moves into the canopy column beside the bottle.
const sizeClasses: Record<HeadingLevel, string> = {
  h1: "text-[clamp(2.75rem,11vw,3.75rem)] lg:text-[clamp(3.5rem,6.5vw,6.5rem)] leading-[1.02] tracking-[-0.025em]",
  h2: "text-[clamp(2.25rem,4vw,4rem)] leading-[1.05] tracking-[-0.02em]",
  h3: "text-2xl leading-tight tracking-[-0.01em]",
};

function renderWithAccent(text: string, accent: string | undefined, italic: boolean) {
  if (!accent) return text;
  const index = text.indexOf(accent);
  if (index === -1) return text;
  const before = text.slice(0, index);
  const after = text.slice(index + accent.length);
  return (
    <>
      {before}
      <span className={italic ? "text-gold italic" : "text-gold"}>{accent}</span>
      {after}
    </>
  );
}

export function DisplayHeading({ children, accent, level, className }: DisplayHeadingProps) {
  const Tag = level;
  return (
    <Tag
      className={`font-heading font-medium text-cream min-w-0 text-balance break-words ${sizeClasses[level]} ${className ?? ""}`}
    >
      {/* Italic is reserved for the single h1 accent phrase. */}
      {renderWithAccent(children, accent, level === "h1")}
    </Tag>
  );
}
