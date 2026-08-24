const fw = { bold: 700, semibold: 600, medium: 500, regular: 400 } as const;

function typoDisplay(fontSize: string) {
  const base = { fontSize, lineHeight: 1.35 as const };
  return {
    ...base,
    bold:     { ...base, fontWeight: fw.bold },
    semibold: { ...base, fontWeight: fw.semibold },
  };
}

function typoHeading(fontSize: string) {
  const base = { fontSize, lineHeight: 1.42 as const };
  return {
    ...base,
    bold:     { ...base, fontWeight: fw.bold },
    semibold: { ...base, fontWeight: fw.semibold },
    medium:   { ...base, fontWeight: fw.medium },
  };
}

function typoBody(fontSize: string) {
  const base = { fontSize, lineHeight: 1.45 as const };
  return {
    ...base,
    bold:     { ...base, fontWeight: fw.bold },
    semibold: { ...base, fontWeight: fw.semibold },
    medium:   { ...base, fontWeight: fw.medium },
    regular:  { ...base, fontWeight: fw.regular },
  };
}

function typoCaption(fontSize: string) {
  const base = { fontSize, lineHeight: 1.47 as const };
  return {
    ...base,
    semibold: { ...base, fontWeight: fw.semibold },
    regular:  { ...base, fontWeight: fw.regular },
  };
}

export const typography = {
  display: {
    large:  typoDisplay('var(--display-large)'),
    medium: typoDisplay('var(--display-medium)'),
    small:  typoDisplay('var(--display-small)'),
  },
  heading: {
    large:  typoHeading('var(--heading-large)'),
    medium: typoHeading('var(--heading-medium)'),
    small:  typoHeading('var(--heading-small)'),
  },
  body: {
    large:  typoBody('17px'),
    medium: typoBody('16px'),
    small:  typoBody('15px'),
  },
  caption: {
    medium: typoCaption('14px'),
    small:  typoCaption('13px'),
    xsmall: typoCaption('12px'),
  },
  label: {
    large:  { fontSize: '17px', lineHeight: '26px', semibold: { fontSize: '17px', lineHeight: '26px', fontWeight: fw.semibold } },
    medium: { fontSize: '16px', lineHeight: '24px', semibold: { fontSize: '16px', lineHeight: '24px', fontWeight: fw.semibold } },
    small:  { fontSize: '15px', lineHeight: '22px', medium:   { fontSize: '15px', lineHeight: '22px', fontWeight: fw.medium } },
    xsmall: { fontSize: '13px', lineHeight: '22px', medium:   { fontSize: '13px', lineHeight: '22px', fontWeight: fw.medium } },
  },
};

export const fontWeight = fw;
