// Runs a code block's content through Prettier's standalone (browser-only,
// no Node APIs) build before saving. Plugins are dynamically imported so
// they only ever load once someone actually blurs a code block in the
// editor - the read-mode/public bundle never touches this file at all.
const languageParsers = {
  javascript: { parser: "babel", plugins: ["babel", "estree"] },
  typescript: { parser: "typescript", plugins: ["typescript", "estree"] },
  jsx: { parser: "babel", plugins: ["babel", "estree"] },
  nextjs: { parser: "babel", plugins: ["babel", "estree"] },
  vue: { parser: "vue", plugins: ["html"] },
  nuxtjs: { parser: "vue", plugins: ["html"] },
  html: { parser: "html", plugins: ["html"] },
  css: { parser: "css", plugins: ["postcss"] },
  scss: { parser: "scss", plugins: ["postcss"] },
  json: { parser: "json", plugins: ["babel", "estree"] },
  // Prettier has no shell-script printer, so bash is intentionally absent
  // here - isFormattableLanguage("bash") is false and formatCode() is a
  // pass-through no-op for it.
};

const pluginLoaders = {
  babel: () => import("prettier/plugins/babel.mjs"),
  estree: () => import("prettier/plugins/estree.mjs"),
  typescript: () => import("prettier/plugins/typescript.mjs"),
  postcss: () => import("prettier/plugins/postcss.mjs"),
  html: () => import("prettier/plugins/html.mjs"),
};

export function isFormattableLanguage(language) {
  return Boolean(languageParsers[language]);
}

export async function formatCode(code, language) {
  const config = languageParsers[language];
  if (!config || !code.trim()) return code;
  try {
    const [prettier, ...pluginModules] = await Promise.all([
      import("prettier/standalone.mjs"),
      ...config.plugins.map((name) => pluginLoaders[name]()),
    ]);
    const formatted = await prettier.format(code, {
      parser: config.parser,
      plugins: pluginModules.map((module) => module.default),
    });
    return formatted.replace(/\n+$/, "");
  } catch {
    // Mid-edit code is often syntactically incomplete - keep the user's raw
    // text rather than blocking on/discarding it over a parse error.
    return code;
  }
}
