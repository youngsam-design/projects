import { useAsset } from "./AssetContext";
import { getMediaClassName } from "./blockVariants";
import MeshGradientBox from "./MeshGradientBox";

export default function VideoBlock({ block, gridProps = {}, meshColors, resolveAssetUrl }) {
  const video = useAsset(block.assetId);
  const poster = useAsset(block.posterAssetId, { optional: true });

  // The .img-wrap wrapper (not the <video> itself) is what carries grid
  // positioning and the legacy vertical-rhythm rules it shares with the
  // static-HTML projects (see ProjectRenderer.scss) - standalone images and
  // videos need it exactly like the old group-wrapped ones did.
  const player = (
    <video
      className={getMediaClassName(block.variant, block.layout)}
      data-block-type="video"
      data-layout={block.layout}
      src={resolveAssetUrl(video.src)}
      poster={poster ? resolveAssetUrl(poster.src) : undefined}
      controls={block.playback.controls}
      autoPlay={block.playback.autoplay}
      muted={block.playback.muted}
      loop={block.playback.loop}
      playsInline
    />
  );

  const captioned = block.caption ? (
    <figure className="project-media-captioned" data-block-type="video" data-layout={block.layout}>
      {player}
      <figcaption>{block.caption}</figcaption>
    </figure>
  ) : (
    player
  );

  const content = block.mesh ? (
    <MeshGradientBox colors={meshColors} seedKey={block.id} warp={block.meshWarp}>
      {captioned}
    </MeshGradientBox>
  ) : (
    captioned
  );

  return (
    <div className={["img-wrap", gridProps.className].filter(Boolean).join(" ")} data-block-type="video" style={gridProps.style}>
      {content}
    </div>
  );
}
