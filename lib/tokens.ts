export type TokenSwatch = {
  name: string;
  cssVar: string;
  value: string;
};

export const colorTokens: TokenSwatch[] = [
  { name: "forest-deep", cssVar: "--forest-deep", value: "#0D1C16" },
  { name: "forest", cssVar: "--forest", value: "#1D3A2F" },
  { name: "gold", cssVar: "--gold", value: "#E3C585" },
  { name: "gold-deep", cssVar: "--gold-deep", value: "#C9A660" },
  { name: "cream", cssVar: "--cream", value: "#FBF7EE" },
  { name: "sage-muted", cssVar: "--sage-muted", value: "#DBE5D9" },
  { name: "glass", cssVar: "--glass", value: "rgba(10,26,20,0.58)" },
  { name: "glass-veil", cssVar: "--glass-veil", value: "rgba(9,22,17,0.60)" },
  { name: "glass-inset", cssVar: "--glass-inset", value: "rgba(9,22,17,0.34)" },
  { name: "glass-solid", cssVar: "--glass-solid", value: "rgba(9,22,17,0.84)" },
  { name: "glass-border", cssVar: "--glass-border", value: "rgba(247,236,212,0.22)" },
  { name: "glass-highlight", cssVar: "--glass-highlight", value: "rgba(255,244,222,0.09)" },
  { name: "surface-nav", cssVar: "--surface-nav", value: "rgba(10,24,19,0.72)" },
];

export const radiusTokens: TokenSwatch[] = [
  { name: "radius-panel", cssVar: "--radius-panel", value: "22px" },
  { name: "radius-pill", cssVar: "--radius-pill", value: "999px" },
  { name: "radius-card", cssVar: "--radius-card", value: "14px" },
];
