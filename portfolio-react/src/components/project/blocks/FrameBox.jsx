import styles from './FrameBox.module.scss';

// Wraps a media block (image/video, captioned or not) in a background-image
// box that the content sits on top of. `padding` toggles a fixed inset per
// side so only the selected edges reveal the background as a frame/mat
// around the media - unselected edges keep the media flush with the box.
export default function FrameBox({ backgroundSrc, children, className, padding = {}, style, ...rest }) {
  return (
    <div {...rest} className={[styles.frameBox, className].filter(Boolean).join(' ')} style={style}>
      <div
        aria-hidden="true"
        className={styles.frameBackground}
        style={backgroundSrc ? { backgroundImage: `url(${backgroundSrc})` } : undefined}
      />
      <div
        className={styles.frameContent}
        style={{
          paddingTop: padding.top ? 'var(--spacing-spacious-md)' : 0,
          paddingBottom: padding.bottom ? 'var(--spacing-spacious-md)' : 0,
          paddingLeft: padding.left ? 'var(--spacing-spacious-md)' : 0,
          paddingRight: padding.right ? 'var(--spacing-spacious-md)' : 0,
          // A corner only reads as "framed" once both of its own sides carry
          // padding - a single padded side has no adjacent inset to round
          // into, so it stays square.
          '--frame-radius-tl': padding.top && padding.left ? 'var(--radius-md)' : '0',
          '--frame-radius-tr': padding.top && padding.right ? 'var(--radius-md)' : '0',
          '--frame-radius-bl': padding.bottom && padding.left ? 'var(--radius-md)' : '0',
          '--frame-radius-br': padding.bottom && padding.right ? 'var(--radius-md)' : '0',
        }}
      >
        {children}
      </div>
    </div>
  );
}
