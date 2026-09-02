import { useSquircleClipPath } from "../../hooks/useSquircleClipPath";
import styles from "./Input.module.scss";

export default function Input({
  className,
  description,
  error,
  label,
  leading,
  multiline = false,
  rows,
  size = "small",
  style,
  ...rest
}) {
  const Field = multiline ? "textarea" : "input";
  // main.scss's global `corner-shape: squircle` already covers this in
  // Chromium - the clip-path here is what makes the same continuous-corner
  // look show up in Safari/Firefox too. A multiline field's `resize:
  // vertical` changes its own height at runtime, which the hook's
  // ResizeObserver already re-measures for.
  const squircle = useSquircleClipPath();

  return (
    <label className={[styles.input, styles[size], className].filter(Boolean).join(" ")} data-invalid={Boolean(error) || undefined}>
      {label && <span className={styles.label}>{label}</span>}
      {description && <span className={styles.description}>{description}</span>}
      <span className={styles.fieldWrap}>
        {leading && <span className={styles.leading}>{leading}</span>}
        <Field
          className={[styles.field, leading && styles.hasLeading].filter(Boolean).join(" ")}
          ref={squircle.ref}
          rows={multiline ? rows : undefined}
          style={{ ...style, ...squircle.style }}
          {...rest}
        />
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
