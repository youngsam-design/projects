import { buildMeshGradient, hashSeed } from "./meshGradient";
import styles from "./MeshGradientBox.module.scss";

// Wraps a media block (image/video, captioned or not) in a soft multi-color
// mesh-gradient background. `seedKey` (the block's own id) keeps the layout
// stable across reloads while still varying from one image to the next.
// Any extra props (data-*, onClick, onContextMenu, ...) are spread onto the
// wrapper so the editor can attach the same interactivity it would otherwise
// put directly on the media element.
//
// `warp` layers an SVG feTurbulence + feDisplacementMap filter over just the
// gradient layer (never the media on top of it) for the organic, noise-bent
// look plain CSS radial-gradients can't produce on their own. It's optional
// because SVG filters aren't free to rasterize - off by default, opt in per
// block/hero.
export default function MeshGradientBox({ children, className, colors, seedKey, style, warp = false, ...rest }) {
  const gradient = buildMeshGradient(seedKey, colors);
  const filterId = `mesh-warp-${String(seedKey ?? "default").replace(/[^a-zA-Z0-9-]/g, "")}`;

  return (
    <div {...rest} className={[styles.meshBox, className].filter(Boolean).join(" ")} style={style}>
      <div
        aria-hidden="true"
        className={styles.meshBackground}
        style={{ ...gradient, filter: warp ? `url(#${filterId})` : undefined }}
      />
      {warp && (
        <svg aria-hidden="true" className={styles.warpFilterDefs}>
          <filter id={filterId}>
            <feTurbulence
              baseFrequency="0.01 0.015"
              numOctaves="2"
              result="warpNoise"
              seed={hashSeed(String(seedKey ?? "mesh")) % 1000}
              type="fractalNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="warpNoise"
              scale="45"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      )}
      <div className={styles.meshContent}>{children}</div>
    </div>
  );
}
