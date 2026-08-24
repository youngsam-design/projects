import {
  getEditorAsset,
  getEditorAssetStorageKey,
  isEditorAssetSource,
} from "./editorAssetStorage.js";
import { assertProjectDocument } from "../schema/validateProjectDocument.js";

export function prepareImportedProjectDocument(value, currentDocument) {
  const imported = typeof value === "string" ? JSON.parse(value) : value;
  assertProjectDocument(imported);
  if (imported.projectId !== currentDocument.projectId) {
    throw new Error("현재 프로젝트와 projectId가 다른 문서입니다.");
  }
  if (imported.slug !== currentDocument.slug) {
    throw new Error("현재 프로젝트와 slug가 다른 문서입니다.");
  }
  return assertProjectDocument({
    ...imported,
    version: currentDocument.version,
  });
}

export async function findMissingEditorAssets(document) {
  const missing = [];
  for (const asset of document.assets) {
    if (!isEditorAssetSource(asset.src)) continue;
    const stored = await getEditorAsset(getEditorAssetStorageKey(asset.src));
    if (!stored) missing.push(asset.id);
  }
  return missing;
}
