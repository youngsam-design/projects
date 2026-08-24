// Mirrored in _breakpoints.scss for the Sass-side consumers (spacing.scss,
// typography.scss) - there's no build-time bridge between the two, so keep
// both in sync by hand when either changes.
export const breakpoints = {
  compact: { max: "320px" },
  medium: { min: "321px", max: "480px" },
  expanded: { min: "481px", max: "767px" },
  large: { min: "768px", max: "1023px" },
  "extra-large": { min: "1024px" },
};

export const container = {
  xl: "1920px",
  lg: "836px",
  md: "496px",
  sm: "428px",
  xs: "360px",
};

export const containerPadding = {
  lg: "32px",
  md: "20px",
  sm: "8px",
};

export const negativeContainerPadding = {
  lg: "-32px",
  md: "-20px",
  sm: "-8px",
};
