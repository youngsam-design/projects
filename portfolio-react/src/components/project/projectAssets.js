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
