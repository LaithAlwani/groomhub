// Fixed palette of schedule colors for groomers. Keys must stay in sync with
// ALLOWED_COLORS in convex/users.ts and the `groomer` color tokens in tailwind.config.js.

export const GROOMER_COLOR_KEYS = ["rose", "amber", "emerald", "sky", "violet", "fuchsia", "cyan", "lime"];

export const GROOMER_COLOR_LABELS = {
  rose:    "Rose",
  amber:   "Amber",
  emerald: "Emerald",
  sky:     "Sky",
  violet:  "Violet",
  fuchsia: "Fuchsia",
  cyan:    "Cyan",
  lime:    "Lime",
};

// Tailwind classes for each color, used on schedule appointment blocks.
export const GROOMER_BLOCK_CLASSES = {
  rose:    "bg-groomer-rose    border-groomer-roseBorder    text-groomer-roseText",
  amber:   "bg-groomer-amber   border-groomer-amberBorder   text-groomer-amberText",
  emerald: "bg-groomer-emerald border-groomer-emeraldBorder text-groomer-emeraldText",
  sky:     "bg-groomer-sky     border-groomer-skyBorder     text-groomer-skyText",
  violet:  "bg-groomer-violet  border-groomer-violetBorder  text-groomer-violetText",
  fuchsia: "bg-groomer-fuchsia border-groomer-fuchsiaBorder text-groomer-fuchsiaText",
  cyan:    "bg-groomer-cyan    border-groomer-cyanBorder    text-groomer-cyanText",
  lime:    "bg-groomer-lime    border-groomer-limeBorder    text-groomer-limeText",
};

// Solid swatch classes for the picker UI.
export const GROOMER_SWATCH_CLASSES = {
  rose:    "bg-groomer-roseSolid",
  amber:   "bg-groomer-amberSolid",
  emerald: "bg-groomer-emeraldSolid",
  sky:     "bg-groomer-skySolid",
  violet:  "bg-groomer-violetSolid",
  fuchsia: "bg-groomer-fuchsiaSolid",
  cyan:    "bg-groomer-cyanSolid",
  lime:    "bg-groomer-limeSolid",
};

// Deterministic fallback for users without a saved color, so blocks still vary
// visually rather than all collapsing to one default.
export function defaultGroomerColor(seed) {
  if (!seed) return "sky";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return GROOMER_COLOR_KEYS[Math.abs(h) % GROOMER_COLOR_KEYS.length];
}

export function blockClassesFor(colorKey, fallbackSeed) {
  const key = colorKey ?? defaultGroomerColor(fallbackSeed);
  return GROOMER_BLOCK_CLASSES[key] ?? GROOMER_BLOCK_CLASSES.sky;
}
