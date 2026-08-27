export const projectDocumentVersion = 2;

export function createProjectDocument({
  projectId,
  slug,
  title,
  excerpt = "",
  theme = {
    mainColor: "42, 108, 242",
    backgroundColor: "255, 255, 255",
    textColor: "28, 28, 31",
    accentActiveColor: "88, 148, 255",
    menuColor: "28, 28, 31",
  },
  meta = [],
  assets = [],
  blocks = [],
  contentWidth = "large",
  version = 1,
}) {
  const coverAsset = {
    id: `ast_${projectId}_cover`,
    kind: "image",
    provider: "local",
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'%3E%3Crect width='100%25' height='100%25' fill='%23e9eefb'/%3E%3C/svg%3E",
  };
  const suppliedCover = assets.find((asset) => asset.kind === "image");
  const documentAssets = suppliedCover ? assets : [...assets, coverAsset];
  return {
    schemaVersion: projectDocumentVersion,
    projectId,
    slug,
    title,
    excerpt,
    pageMeta: {
      bodyClass: "pages",
      bodyStyle: "",
      styles: "",
    },
    hero: {
      eyebrow: "새 프로젝트",
      coverAssetId: suppliedCover?.id ?? coverAsset.id,
    },
    theme,
    meta,
    relatedProjects: [],
    assets: documentAssets,
    blocks,
    contentWidth,
    version,
  };
}
