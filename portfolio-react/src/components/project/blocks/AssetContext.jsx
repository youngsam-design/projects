import { createContext, useContext } from "react";

const AssetContext = createContext(new Map());

export function AssetProvider({ assets, children }) {
  return (
    <AssetContext.Provider
      value={new Map(assets.map((asset) => [asset.id, asset]))}
    >
      {children}
    </AssetContext.Provider>
  );
}

export function useAsset(assetId, { optional = false } = {}) {
  const assets = useContext(AssetContext);
  const asset = assets.get(assetId);

  if (!assetId && optional) return null;
  if (!asset) throw new Error(`Unknown project asset '${assetId}'`);
  return asset;
}
