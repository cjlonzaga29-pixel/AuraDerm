import type { ReactElement, ReactNode } from "react";

type IllustrationProps = {
  title: string;
  className?: string;
};

/**
 * Shared base: a soft emerald roundel with a lime hairline ring, so every
 * concept illustration reads as one consistent family at a glance.
 */
function Roundel({
  title,
  className,
  children,
}: IllustrationProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 72 72"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <circle cx="36" cy="36" r="34" fill="var(--forest)" opacity="0.5" />
      <circle cx="36" cy="36" r="34" fill="none" stroke="var(--gold)" strokeOpacity="0.35" />
      {children}
    </svg>
  );
}

export function GreenTeaIllustration({ title, className }: IllustrationProps) {
  return (
    <Roundel title={title} className={className}>
      <path
        d="M36 50C36 50 22 42 22 29C22 21 29 16 36 16C43 16 50 21 50 29C50 42 36 50 36 50Z"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
      />
      <path d="M36 16V50" stroke="var(--gold)" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M36 26C32 28 29 31 28 36" stroke="var(--cream)" strokeWidth="1.2" strokeOpacity="0.6" strokeLinecap="round" />
    </Roundel>
  );
}

export function AloeIllustration({ title, className }: IllustrationProps) {
  return (
    <Roundel title={title} className={className}>
      <path d="M36 52V30" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 32C30 28 26 20 27 14C33 16 37 23 37 30" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M36 32C42 28 46 20 45 14C39 16 35 23 35 30" fill="none" stroke="var(--cream)" strokeWidth="2" strokeOpacity="0.75" strokeLinejoin="round" />
      <path d="M36 40C31 37 28 32 28 26" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeOpacity="0.6" strokeLinejoin="round" />
    </Roundel>
  );
}

export function OatIllustration({ title, className }: IllustrationProps) {
  return (
    <Roundel title={title} className={className}>
      <path d="M36 54V18" stroke="var(--gold)" strokeWidth="1.5" strokeOpacity="0.7" />
      {[20, 27, 34, 41].map((y) => (
        <g key={y}>
          <ellipse cx="30" cy={y} rx="5.5" ry="3.5" transform={`rotate(-20 30 ${y})`} fill="var(--cream)" fillOpacity="0.85" />
          <ellipse cx="42" cy={y + 3} rx="5.5" ry="3.5" transform={`rotate(20 42 ${y + 3})`} fill="var(--gold)" fillOpacity="0.8" />
        </g>
      ))}
    </Roundel>
  );
}

export function ChamomileIllustration({ title, className }: IllustrationProps) {
  const petals = Array.from({ length: 8 });
  return (
    <Roundel title={title} className={className}>
      <g transform="translate(36 34)">
        {petals.map((_, i) => {
          const angle = (360 / petals.length) * i;
          return (
            <ellipse
              key={i}
              cx="0"
              cy="-13"
              rx="4"
              ry="9"
              fill="var(--cream)"
              fillOpacity="0.85"
              transform={`rotate(${angle})`}
            />
          );
        })}
        <circle r="6.5" fill="var(--gold)" />
      </g>
    </Roundel>
  );
}

export function RoseIllustration({ title, className }: IllustrationProps) {
  return (
    <Roundel title={title} className={className}>
      <g transform="translate(36 34)">
        <circle r="12" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
        <circle r="8" fill="none" stroke="var(--cream)" strokeOpacity="0.8" strokeWidth="1.5" />
        <circle r="4" fill="var(--gold)" />
      </g>
      <path d="M36 46V58" stroke="var(--gold)" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
    </Roundel>
  );
}

export const INGREDIENT_ILLUSTRATIONS: Record<
  string,
  (props: IllustrationProps) => ReactElement
> = {
  "GREEN TEA": GreenTeaIllustration,
  ALOE: AloeIllustration,
  OAT: OatIllustration,
  CHAMOMILE: ChamomileIllustration,
  ROSE: RoseIllustration,
};

/** Distinct full-bleed concept visuals for the four ritual steps. */
function StepBackdrop({
  title,
  className,
  children,
}: IllustrationProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 160"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="120" height="160" fill="var(--forest)" opacity="0.55" />
      {children}
    </svg>
  );
}

export function CleanseConcept({ title, className }: IllustrationProps) {
  return (
    <StepBackdrop title={title} className={className}>
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={60}
          cy={130 - i * 34}
          r={10 + i * 6}
          fill="none"
          stroke="var(--cream)"
          strokeOpacity={0.5 - i * 0.1}
          strokeWidth="1.5"
        />
      ))}
      <path
        d="M48 70C48 54 60 44 60 44C60 44 72 54 72 70C72 79 66.6 86 60 86C53.4 86 48 79 48 70Z"
        fill="var(--gold)"
        fillOpacity="0.85"
      />
    </StepBackdrop>
  );
}

export function PrepareConcept({ title, className }: IllustrationProps) {
  return (
    <StepBackdrop title={title} className={className}>
      <path d="M60 30V130" stroke="var(--gold)" strokeOpacity="0.6" strokeWidth="1.5" />
      {[-26, 0, 26].map((dx, i) => (
        <path
          key={dx}
          d={`M60 ${90 - i * 14}C${60 + dx} ${90 - i * 14} ${60 + dx} ${60 - i * 10} 60 ${50 - i * 10}`}
          fill="none"
          stroke="var(--cream)"
          strokeOpacity="0.7"
          strokeWidth="1.5"
        />
      ))}
      <circle cx="60" cy="100" r="7" fill="var(--gold)" />
    </StepBackdrop>
  );
}

export function HydrateConcept({ title, className }: IllustrationProps) {
  return (
    <StepBackdrop title={title} className={className}>
      <path
        d="M60 36C60 36 82 70 82 94C82 106 72 116 60 116C48 116 38 106 38 94C38 70 60 36 60 36Z"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
      />
      <path
        d="M60 60C60 60 72 80 72 94C72 101 66.6 106 60 106"
        fill="none"
        stroke="var(--cream)"
        strokeOpacity="0.75"
        strokeWidth="1.5"
      />
      <circle cx="44" cy="54" r="3" fill="var(--cream)" fillOpacity="0.6" />
      <circle cx="78" cy="68" r="2.5" fill="var(--cream)" fillOpacity="0.5" />
    </StepBackdrop>
  );
}

export function FinishConcept({ title, className }: IllustrationProps) {
  const rays = Array.from({ length: 10 });
  return (
    <StepBackdrop title={title} className={className}>
      <g transform="translate(60 80)">
        {rays.map((_, i) => {
          const angle = (360 / rays.length) * i;
          return (
            <line
              key={i}
              x1="0"
              y1="-18"
              x2="0"
              y2="-30"
              stroke="var(--gold)"
              strokeOpacity="0.7"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${angle})`}
            />
          );
        })}
        <circle r="16" fill="var(--cream)" fillOpacity="0.85" />
        <circle r="16" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
      </g>
    </StepBackdrop>
  );
}

export const ACTIVE_CONCEPTS: Record<
  string,
  (props: IllustrationProps) => ReactElement
> = {
  CLN: CleanseConcept,
  PRP: PrepareConcept,
  HYD: HydrateConcept,
  FIN: FinishConcept,
};

export function RoutineVesselIllustration({ title, className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect x="44" y="18" width="12" height="14" rx="3" fill="var(--gold)" fillOpacity="0.85" />
      <path
        d="M40 32H60C64 32 66 36 66 42V92C66 100 60 106 50 106C40 106 34 100 34 92V42C34 36 36 32 40 32Z"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
      />
      <path
        d="M34 70H66"
        stroke="var(--cream)"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      <path
        d="M38 68V92C38 98 43 102 50 102C57 102 62 98 62 92V68"
        fill="var(--cream)"
        fillOpacity="0.6"
      />
    </svg>
  );
}

export function LessIcon({ className }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className={className}>
      <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 14H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TextureIcon({ className }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className={className}>
      <path d="M14 5C14 5 21 11 21 17C21 21 18 24 14 24C10 24 7 21 7 17C7 11 14 5 14 5Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 11V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CalmIcon({ className }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 17C9 17 9 11 14 11C19 11 19 17 22 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 21C9 21 9 15 14 15C19 15 19 21 22 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
