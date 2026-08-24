const projectFiles = import.meta.glob(
  ["./*.json", "!./1min-return.json", "!./manifest.json"],
  { import: "default" },
);

const projectLoaders = Object.fromEntries(
  Object.entries(projectFiles).map(([path, load]) => [
    path.match(/\.\/([^/]+)\.json$/)?.[1],
    load,
  ]),
);

export async function loadProjectContent(slug) {
  return projectLoaders[slug]?.() ?? null;
}
