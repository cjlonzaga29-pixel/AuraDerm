import Image from "next/image";
import Link from "next/link";

// Official AuraDerm Botanicals crest (public/brand/auraderm-logo.png, trimmed of
// transparent margin only; source kept in public/source/logo). Shown directly on
// the page with no backing, per owner direction.
// Header: fitted to the bar height (h-16 / lg:h-20) so the header never grows.
const SIZES = {
  header: {
    width: 60,
    height: 64,
    img: "h-12 w-auto lg:h-16",
  },
  footer: {
    width: 140,
    height: 150,
    img: "h-[120px] w-auto md:h-[150px]",
  },
} as const;

export function Logo({ variant = "header" }: { variant?: keyof typeof SIZES }) {
  const size = SIZES[variant];

  return (
    <Link
      href="/"
      className="inline-flex shrink-0 rounded-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Image
        src="/brand/auraderm-logo.png"
        alt="AuraDerm Botanicals home"
        width={size.width}
        height={size.height}
        loading={variant === "header" ? "eager" : "lazy"}
        className={`object-contain ${size.img}`}
      />
    </Link>
  );
}
