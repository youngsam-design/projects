export function getProjectAsset(document, assetId) {
  const asset = document.assets.find((candidate) => candidate.id === assetId);
  if (!asset) throw new Error(`Unknown project asset '${assetId}'`);
  return asset;
}

export function resolveProjectAssetUrl(document, src) {
  if (!src || /^(?:[a-z]+:|\/|#)/i.test(src)) return src;
  return new URL(
    src,
    `${window.location.origin}${import.meta.env.BASE_URL}work/${document.slug}/`,
  ).pathname;
}

// Assets uploaded through the editor always have a real `name` (the
// original filename - see createUploadedAsset), but assets carried over
// from the pre-editor static content only have an internal id like
// "ast_bz_hero" - falling back straight to that id is what a picker like
// the cover-image select would otherwise show. The asset's own filename
// (from `src`) reads far more like something a person picked than the id
// does, so it's a better middle fallback before the id itself.
export function getAssetLabel(asset) {
  if (asset.name) return asset.name;
  const fileName = asset.src?.split("/").pop();
  return fileName || asset.id;
}
