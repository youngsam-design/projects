import {
  putEditorAsset,
  removeEditorAsset,
} from "../editor/editorAssetStorage";
import { createUploadedAsset } from "../editor/projectBlockFactory";
import {
  contentApiRequest,
  hasRemoteContentApi,
  uploadToPresignedUrl,
} from "./contentApiClient";

export async function uploadProjectAsset({ document, file, kind, onProgress }) {
  if (!hasRemoteContentApi()) {
    const asset = createUploadedAsset(file, kind);
    onProgress?.(10);
    await putEditorAsset(asset.id, file);
    onProgress?.(100);
    return asset;
  }
  const initialized = await contentApiRequest("/api/admin/uploads/init", {
    method: "POST",
    body: JSON.stringify({
      projectId: document.projectId,
      fileName: file.name,
      mimeType: file.type,
      byteSize: file.size,
      kind,
    }),
  });
  await uploadToPresignedUrl(initialized.upload, file, onProgress);
  const completed = await contentApiRequest(
    `/api/admin/uploads/${encodeURIComponent(initialized.assetId)}/complete`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
  return { ...(completed.asset ?? completed), editorOwned: true };
}

export async function deleteProjectAsset(asset) {
  if (!hasRemoteContentApi()) return removeEditorAsset(asset.id);
  await contentApiRequest(`/api/admin/assets/${encodeURIComponent(asset.id)}`, {
    method: "DELETE",
  });
}
