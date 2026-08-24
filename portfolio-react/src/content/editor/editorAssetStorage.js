const databaseName = "portfolio-editor";
const databaseVersion = 1;
const storeName = "project-assets";
export const editorAssetProtocol = "editor-asset://";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, operation) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export function isEditorAssetSource(src) {
  return src?.startsWith(editorAssetProtocol);
}

export function getEditorAssetStorageKey(src) {
  return src.slice(editorAssetProtocol.length);
}

export function putEditorAsset(assetId, file) {
  return withStore("readwrite", (store) => store.put(file, assetId));
}

export function getEditorAsset(assetId) {
  return withStore("readonly", (store) => store.get(assetId));
}

export function removeEditorAsset(assetId) {
  return withStore("readwrite", (store) => store.delete(assetId));
}

export async function materializeEditorAssets(document) {
  const urls = [];
  const assets = await Promise.all(
    document.assets.map(async (asset) => {
      if (!isEditorAssetSource(asset.src)) return asset;
      const blob = await getEditorAsset(getEditorAssetStorageKey(asset.src));
      if (!blob) return asset;
      const src = URL.createObjectURL(blob);
      urls.push(src);
      return { ...asset, src };
    }),
  );
  return { document: { ...document, assets }, urls };
}

export async function removeDocumentEditorAssets(document) {
  await Promise.all(
    document.assets
      .filter((asset) => isEditorAssetSource(asset.src))
      .map((asset) => removeEditorAsset(getEditorAssetStorageKey(asset.src))),
  );
}
