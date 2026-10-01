type HeadingLevel = "h1" | "h2" | "h3";

type DisplayHeadingProps = {
  children: string;
  accent?: string;
  level: HeadingLevel;
  className?: string;
};

const sizeClasses: Record<HeadingLevel, string> = {
  h1: "text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-[0.01em]",
  h2: "text-[clamp(2rem,4.5vw,3.5rem)] leading-[1] tracking-[0.015em]",
  h3: "text-[clamp(1.25rem,2.5vw,1.75rem)] leading-[1.05] tracking-[0.02em]",
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
      className={`font-display font-normal uppercase text-cream min-w-0 break-words ${sizeClasses[level]} ${className ?? ""}`}
    >
      {renderWithAccent(children, accent)}
    </Tag>
  );
}
