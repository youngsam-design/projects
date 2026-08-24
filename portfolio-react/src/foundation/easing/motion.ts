export const motion = {
  duration: {
    long: {
      '03': 'var(--duration-long-03)',
      '02': 'var(--duration-long-02)',
      '01': 'var(--duration-long-01)',
    },
    medium: {
      '03': 'var(--duration-medium-03)',
      '02': 'var(--duration-medium-02)',
      '01': 'var(--duration-medium-01)',
    },
    short: {
      '03': 'var(--duration-short-03)',
      '02': 'var(--duration-short-02)',
      '01': 'var(--duration-short-01)',
    },
  },
  easing: {
    linear:             'var(--easing-linear)',
    standard:           'var(--easing-standard)',
    standardAccelerate: 'var(--easing-standard-accelerate)',
    standardDecelerate: 'var(--easing-standard-decelerate)',
  },
  // The onScreen/enterScreen/exitScreen presets are available as plain CSS
  // classes in easing/motion.css (.on-screen/.enter-screen/.exit-screen) —
  // no JS-side equivalent needed for CSS Modules consumption.
} as const;
