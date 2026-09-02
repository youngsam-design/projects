import { useCursorActive, useCursorHandlers } from "../effects/Cursor";
import { useSquircleClipPath } from "../../hooks/useSquircleClipPath";
import Icon from "./Icon";
import styles from "./IconButton.module.scss";

// `icon` is always a name from Icon's registry (src/assets/icon) - never a
// raw asset path or ReactNode - so this can't become a second way to pull in
// icons from somewhere else.
export default function IconButton({
  className,
  icon,
  label,
  onMouseEnter,
  onMouseLeave,
  size = "medium",
  style,
  type = "button",
  variant = "primary",
  ...rest
}) {
  const cursorActive = useCursorActive();
  const cursorHandlers = useCursorHandlers({ onMouseEnter, onMouseLeave });
  // main.scss's global `corner-shape: squircle` already covers this in
  // Chromium - the clip-path here is what makes the same continuous-corner
  // look show up in Safari/Firefox too.
  const squircle = useSquircleClipPath();
  return (
    <button
      aria-label={label}
      // The custom cursor already provides hover feedback where it's active
      // (useCursorActive, Cursor.jsx) - the ::after wash would be redundant.
      className={[styles.iconButton, styles[variant], styles[size], cursorActive && styles.cursorActive, className]
        .filter(Boolean)
        .join(" ")}
      ref={squircle.ref}
      style={{ ...style, ...squircle.style }}
      type={type}
      {...cursorHandlers}
      {...rest}
    >
      <Icon className={styles.icon} name={icon} />
    </button>
  );
}
