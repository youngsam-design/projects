import { useRef, useState } from "react";
import Icon from "../../ui/Icon";

// Shared by the read-mode renderer (VideoBlock.jsx) and the WYSIWYG editor
// canvas (WysiwygProjectCanvas.jsx's Media) so both show the exact same
// custom play/pause control - and so a project's video looks the same while
// editing as it will once published.
export function useVideoPlayback(initialPlaying) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) element.play();
    else element.pause();
  };

  const videoHandlers = {
    onPause: () => setIsPlaying(false),
    onPlay: () => setIsPlaying(true),
    onTimeUpdate: (event) => {
      const { currentTime, duration } = event.currentTarget;
      setProgress(Number.isFinite(duration) && duration > 0 ? currentTime / duration : 0);
    },
  };

  return { isPlaying, progress, toggle, videoHandlers, videoRef };
}

// All four icons (play/pause x default/hover) stay mounted at once, stacked
// into the same grid cell as each other (but sized smaller than the button
// itself, see CSS) so the progress ring drawn around them stays visible - the
// icons' own baked-in ring/fill is a fixed frame, this ring is the one thing
// here that's actually live. Cross-fading is opacity-only rather than one
// icon replacing another: the hover pair's visibility is driven purely by
// CSS (:hover/:focus-visible), while an inline opacity:0 on whichever pair
// doesn't match isPlaying forces it hidden regardless of hover state (inline
// style always wins over the class-based hover rule).
export default function VideoPlaybackControl({ isPlaying, onToggle, progress }) {
  return (
    <button
      aria-label={isPlaying ? "일시정지" : "재생"}
      aria-pressed={isPlaying}
      className="video-playback-control"
      onClick={onToggle}
      type="button"
    >
      <svg aria-hidden="true" className="video-playback-ring" viewBox="0 0 40 40">
        <circle className="video-playback-ring-track" cx="20" cy="20" pathLength="1" r="18" />
        <circle
          className="video-playback-ring-progress"
          cx="20"
          cy="20"
          pathLength="1"
          r="18"
          style={{ strokeDasharray: 1, strokeDashoffset: 1 - progress }}
        />
      </svg>
      <Icon className="video-playback-icon" name="videoPlay" style={isPlaying ? { opacity: 0 } : undefined} />
      <Icon
        className="video-playback-icon video-playback-icon-hover"
        name="videoPlayHover"
        style={isPlaying ? { opacity: 0 } : undefined}
      />
      <Icon className="video-playback-icon" name="videoPause" style={isPlaying ? undefined : { opacity: 0 }} />
      <Icon
        className="video-playback-icon video-playback-icon-hover"
        name="videoPauseHover"
        style={isPlaying ? undefined : { opacity: 0 }}
      />
    </button>
  );
}
