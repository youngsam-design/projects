import { useAsset } from "./AssetContext";
import { getMediaClassName } from "./blockVariants";
import FrameBox from "./FrameBox";
import VideoPlaybackControl, { useVideoPlayback } from "./VideoPlaybackControl";

export default function VideoBlock({ block, gridProps = {}, resolveAssetUrl }) {
  const video = useAsset(block.assetId);
  const poster = useAsset(block.posterAssetId, { optional: true });
  const frameBackground = useAsset(block.frameBackgroundAssetId, { optional: true });
  const { isPlaying, progress, toggle, videoHandlers, videoRef } = useVideoPlayback(block.playback.autoplay);

  // The custom bottom-right control below is the sole way to see or change
  // playback state when the "컨트롤 표시" option is on - the browser's own
  // controls bar (heavier, and styled per-browser rather than to match the
  // site) never renders at all, so `controls` on the element itself stays
  // permanently off regardless of block.playback.controls.
  const mediaElement = (
    <video
      className={getMediaClassName(block.variant, block.layout)}
      data-block-type="video"
      data-layout={block.layout}
      src={resolveAssetUrl(video.src)}
      poster={poster ? resolveAssetUrl(poster.src) : undefined}
      autoPlay={block.playback.autoplay}
      muted={block.playback.muted}
      loop={block.playback.loop}
      playsInline
      ref={videoRef}
      {...videoHandlers}
    />
  );

  const player = block.playback.controls ? (
    <div className="video-player">
      {mediaElement}
      <VideoPlaybackControl isPlaying={isPlaying} onToggle={toggle} progress={progress} />
    </div>
  ) : (
    mediaElement
  );

  const captioned = block.caption ? (
    <figure className="project-media-captioned" data-block-type="video" data-layout={block.layout}>
      {player}
      <figcaption>{block.caption}</figcaption>
    </figure>
  ) : (
    player
  );

  const content = block.frame ? (
    <FrameBox
      backgroundSrc={frameBackground ? resolveAssetUrl(frameBackground.src) : undefined}
      padding={{
        top: block.framePaddingTop,
        bottom: block.framePaddingBottom,
        left: block.framePaddingLeft,
        right: block.framePaddingRight,
      }}
    >
      {captioned}
    </FrameBox>
  ) : (
    captioned
  );

  return (
    <div className={["img-wrap", gridProps.className].filter(Boolean).join(" ")} data-block-type="video" style={gridProps.style}>
      {content}
    </div>
  );
}
