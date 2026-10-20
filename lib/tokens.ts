export type TokenSwatch = {
  name: string;
  cssVar: string;
  value: string;
};

export const colorTokens: TokenSwatch[] = [
  { name: "forest-deep", cssVar: "--forest-deep", value: "#0D1C16" },
  { name: "forest", cssVar: "--forest", value: "#1D3A2F" },
  { name: "gold", cssVar: "--gold", value: "#DDC9A3" },
  { name: "gold-deep", cssVar: "--gold-deep", value: "#C4AD83" },
  { name: "cream", cssVar: "--cream", value: "#FBF7EE" },
  { name: "sage-muted", cssVar: "--sage-muted", value: "#DBE5D9" },
  { name: "hairline", cssVar: "--hairline", value: "rgba(247,240,226,0.16)" },
  { name: "scrim", cssVar: "--scrim", value: "rgba(9,22,17,0.66)" },
  { name: "glass", cssVar: "--glass", value: "rgba(10,26,20,0.64)" },
  { name: "glass-veil", cssVar: "--glass-veil", value: "rgba(9,22,17,0.60)" },
  { name: "glass-inset", cssVar: "--glass-inset", value: "rgba(9,22,17,0.34)" },
  { name: "glass-solid", cssVar: "--glass-solid", value: "rgba(9,22,17,0.84)" },
  { name: "glass-border", cssVar: "--glass-border", value: "rgba(247,236,212,0.18)" },
  { name: "glass-highlight", cssVar: "--glass-highlight", value: "rgba(255,244,222,0.07)" },
  { name: "surface-nav", cssVar: "--surface-nav", value: "rgba(9,22,17,0.70)" },
];

export const radiusTokens: TokenSwatch[] = [
  { name: "radius-panel", cssVar: "--radius-panel", value: "20px" },
  { name: "radius-pill", cssVar: "--radius-pill", value: "999px" },
  { name: "radius-card", cssVar: "--radius-card", value: "14px" },
];
