import { useCursorActive, useCursorHandlers } from "../effects/Cursor";
import Icon from "./Icon";
import styles from "./Button.module.scss";

// `iconStart`/`iconEnd` are always names from Icon's registry (src/assets/icon)
// - never a raw asset path or ReactNode - so this can't become a second way
// to pull in icons from somewhere else.
//
// `as` swaps the rendered element/component (e.g. `NavLink`) for cases that
// need real link semantics (routing, right-click "open in new tab") instead
// of a `<button>` - `type` only makes sense on an actual `<button>`, so it's
// only applied then.
export default function Button({
  as: Component = "button",
  children,
  className,
  iconEnd,
  iconStart,
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
    <Component
      // "no-scale" opts this element out of Cursor.jsx's generic <a>
      // hover-enlarge delegation - `cursorHandlers` above already snaps the
      // cursor to this exact element, so the generic effect would just pile
      // an extra 1.5x scale on top of that when `as` renders an anchor.
      // `cursorActive` drops the button's own hover/pressed wash for the
      // same reason - the cursor is already the hover feedback there.
      className={[styles.button, styles[variant], styles[size], cursorActive && styles.cursorActive, className, "no-scale"]
        .filter(Boolean)
        .join(" ")}
      {...(Component === "button" ? { type } : {})}
      {...cursorHandlers}
      {...rest}
    >
      {iconStart && <Icon className={styles.icon} name={iconStart} />}
      {children && <span className={styles.label}>{children}</span>}
      {iconEnd && <Icon className={styles.icon} name={iconEnd} />}
    </Component>
  );
}
