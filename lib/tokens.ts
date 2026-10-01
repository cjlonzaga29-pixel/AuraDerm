export type TokenSwatch = {
  name: string;
  cssVar: string;
  value: string;
};

export const colorTokens: TokenSwatch[] = [
  { name: "forest-deep", cssVar: "--forest-deep", value: "#0F2318" },
  { name: "forest", cssVar: "--forest", value: "#1C3A28" },
  { name: "gold", cssVar: "--gold", value: "#C7E04A" },
  { name: "gold-deep", cssVar: "--gold-deep", value: "#A3C13A" },
  { name: "cream", cssVar: "--cream", value: "#F4F1E4" },
  { name: "sage-muted", cssVar: "--sage-muted", value: "#A8C08A" },
  { name: "glass", cssVar: "--glass", value: "rgba(20,38,28,0.20)" },
  { name: "glass-solid", cssVar: "--glass-solid", value: "rgba(15,35,24,0.82)" },
  { name: "glass-border", cssVar: "--glass-border", value: "rgba(230,236,214,0.18)" },
  { name: "glass-highlight", cssVar: "--glass-highlight", value: "rgba(255,255,255,0.06)" },
  { name: "surface-nav", cssVar: "--surface-nav", value: "rgba(15,35,24,0.66)" },
];

export const radiusTokens: TokenSwatch[] = [
  { name: "radius-panel", cssVar: "--radius-panel", value: "20px" },
  { name: "radius-pill", cssVar: "--radius-pill", value: "999px" },
  { name: "radius-card", cssVar: "--radius-card", value: "14px" },
];
