import { useAsset } from "./AssetContext";
import { getMediaClassName } from "./blockVariants";
import MeshGradientBox from "./MeshGradientBox";

export default function ImageBlock({ block, gridProps = {}, meshColors, resolveAssetUrl }) {
  const asset = useAsset(block.assetId);
  // The .img-wrap wrapper (not the <img> itself) is what carries grid
  // positioning and the legacy vertical-rhythm rules it shares with the
  // static-HTML projects (see ProjectRenderer.scss) - standalone images and
  // videos need it exactly like the old group-wrapped ones did.
  const image = (
    <img
      alt={block.alt}
      className={getMediaClassName(block.variant, block.layout)}
      data-block-type="image"
      data-layout={block.layout}
      src={resolveAssetUrl(asset.src)}
    />
  );

  const captioned = block.caption ? (
    <figure className="project-media-captioned" data-block-type="image" data-layout={block.layout}>
      {image}
      <figcaption>{block.caption}</figcaption>
    </figure>
  ) : (
    image
  );

  const content = block.mesh ? (
    <MeshGradientBox colors={meshColors} seedKey={block.id} warp={block.meshWarp}>
      {captioned}
    </MeshGradientBox>
  ) : (
    captioned
  );

  return (
    <div className={["img-wrap", gridProps.className].filter(Boolean).join(" ")} data-block-type="image" style={gridProps.style}>
      {content}
    </div>
  );
}
