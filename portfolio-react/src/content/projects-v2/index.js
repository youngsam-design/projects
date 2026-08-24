import { assertProjectDocument } from "../schema/validateProjectDocument";

const projectFiles = import.meta.glob("./*.json", {
  import: "default",
});

const projectLoaders = Object.fromEntries(
  Object.entries(projectFiles).map(([path, load]) => [
    path.match(/\.\/([^/]+)\.json$/)?.[1],
    load,
  ]),
);

export async function loadProjectV2Content(slug) {
  const load = projectLoaders[slug];
  if (!load) return null;
  return assertProjectDocument(await load());
}
