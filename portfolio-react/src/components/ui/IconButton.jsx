import Icon from "./Icon";
import styles from "./IconButton.module.scss";

// `icon` is always a name from Icon's registry (src/assets/icon) - never a
// raw asset path or ReactNode - so this can't become a second way to pull in
// icons from somewhere else.
export default function IconButton({ className, icon, label, size = "medium", type = "button", variant = "primary", ...rest }) {
  return (
    <button
      aria-label={label}
      className={[styles.iconButton, styles[variant], styles[size], className].filter(Boolean).join(" ")}
      type={type}
      {...rest}
    >
      <Icon className={styles.icon} name={icon} />
    </button>
  );
}
