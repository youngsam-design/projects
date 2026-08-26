import Icon from "./Icon";
import styles from "./Button.module.scss";

// `iconStart`/`iconEnd` are always names from Icon's registry (src/assets/icon)
// - never a raw asset path or ReactNode - so this can't become a second way
// to pull in icons from somewhere else.
export default function Button({
  children,
  className,
  iconEnd,
  iconStart,
  size = "medium",
  type = "button",
  variant = "primary",
  ...rest
}) {
  return (
    <button
      className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ")}
      type={type}
      {...rest}
    >
      {iconStart && <Icon className={styles.icon} name={iconStart} />}
      {children && <span className={styles.label}>{children}</span>}
      {iconEnd && <Icon className={styles.icon} name={iconEnd} />}
    </button>
  );
}
