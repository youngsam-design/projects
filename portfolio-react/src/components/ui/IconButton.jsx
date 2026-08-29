import { useCursorActive, useCursorHandlers } from "../effects/Cursor";
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
  type = "button",
  variant = "primary",
  ...rest
}) {
  const cursorActive = useCursorActive();
  const cursorHandlers = useCursorHandlers({ onMouseEnter, onMouseLeave });
  return (
    <button
      aria-label={label}
      // The custom cursor already provides hover feedback where it's active
      // (useCursorActive, Cursor.jsx) - the ::after wash would be redundant.
      className={[styles.iconButton, styles[variant], styles[size], cursorActive && styles.cursorActive, className]
        .filter(Boolean)
        .join(" ")}
      type={type}
      {...cursorHandlers}
      {...rest}
    >
      <Icon className={styles.icon} name={icon} />
    </button>
  );
}
