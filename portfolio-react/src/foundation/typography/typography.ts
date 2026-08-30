const fw = { bold: 700, semibold: 600, medium: 500, regular: 400 } as const;

function typoDisplay(fontSize: string) {
  const base = { fontSize, lineHeight: 1.35 as const };
  return {
    ...base,
    bold: { ...base, fontWeight: fw.bold },
    semibold: { ...base, fontWeight: fw.semibold },
  };
}

function typoHeading(fontSize: string) {
  const base = { fontSize, lineHeight: 1.42 as const };
  return {
    ...base,
    bold: { ...base, fontWeight: fw.bold },
    semibold: { ...base, fontWeight: fw.semibold },
    medium: { ...base, fontWeight: fw.medium },
  };
}

function typoBody(fontSize: string) {
  const base = { fontSize, lineHeight: 1.45 as const };
  return {
    ...base,
    bold: { ...base, fontWeight: fw.bold },
    semibold: { ...base, fontWeight: fw.semibold },
    medium: { ...base, fontWeight: fw.medium },
    regular: { ...base, fontWeight: fw.regular },
  };
}

function typoCaption(fontSize: string) {
  const base = { fontSize, lineHeight: 1.47 as const };
  return {
    ...base,
    semibold: { ...base, fontWeight: fw.semibold },
    regular: { ...base, fontWeight: fw.regular },
  };
}

export const typography = {
  display: {
    lg: typoDisplay('var(--display-lg)'),
    md: typoDisplay('var(--display-md)'),
    sm: typoDisplay('var(--display-sm)'),
  },
  heading: {
    lg: typoHeading('var(--heading-lg)'),
    md: typoHeading('var(--heading-md)'),
    sm: typoHeading('var(--heading-sm)'),
  },
  body: {
    lg: typoBody('17px'),
    md: typoBody('16px'),
    sm: typoBody('15px'),
  },
  caption: {
    md: typoCaption('14px'),
    sm: typoCaption('13px'),
    xs: typoCaption('12px'),
  },
  label: {
    lg: {
      fontSize: '17px',
      lineHeight: '26px',
      semibold: { fontSize: '17px', lineHeight: '26px', fontWeight: fw.semibold },
    },
    md: {
      fontSize: '16px',
      lineHeight: '24px',
      semibold: { fontSize: '16px', lineHeight: '24px', fontWeight: fw.semibold },
    },
    sm: {
      fontSize: '15px',
      lineHeight: '22px',
      medium: { fontSize: '15px', lineHeight: '22px', fontWeight: fw.medium },
    },
    xs: {
      fontSize: '13px',
      lineHeight: '22px',
      medium: { fontSize: '13px', lineHeight: '22px', fontWeight: fw.medium },
    },
  },
};

export const fontWeight = fw;
