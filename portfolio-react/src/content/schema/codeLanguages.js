// Curated subset of languages a code block can be tagged as - not Prism's
// full list, just the ones actually relevant to this portfolio's work
// (frontend/web stacks). `prismLanguage` is the actual Prism grammar used to
// highlight it; several labels intentionally share one grammar (Next.js is
// React/JSX, Nuxt.js and Vue.js templates are HTML-like) since Prism has no
// dedicated grammar for those frameworks themselves.
export const codeLanguages = Object.freeze([
  { value: "javascript", label: "JavaScript", prismLanguage: "javascript" },
  { value: "typescript", label: "TypeScript", prismLanguage: "typescript" },
  { value: "jsx", label: "React (JSX)", prismLanguage: "jsx" },
  { value: "nextjs", label: "Next.js", prismLanguage: "jsx" },
  { value: "vue", label: "Vue.js", prismLanguage: "markup" },
  { value: "nuxtjs", label: "Nuxt.js", prismLanguage: "markup" },
  { value: "html", label: "HTML", prismLanguage: "markup" },
  { value: "css", label: "CSS", prismLanguage: "css" },
  { value: "scss", label: "SCSS", prismLanguage: "scss" },
  { value: "json", label: "JSON", prismLanguage: "json" },
  { value: "bash", label: "Bash", prismLanguage: "bash" },
]);

export const codeLanguageValues = codeLanguages.map((language) => language.value);

export function getCodeLanguageLabel(value) {
  return codeLanguages.find((language) => language.value === value)?.label ?? value;
}

export function getPrismLanguage(value) {
  return codeLanguages.find((language) => language.value === value)?.prismLanguage ?? "javascript";
}
