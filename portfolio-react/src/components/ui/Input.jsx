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
  ...rest
}) {
  const Field = multiline ? "textarea" : "input";

  return (
    <label className={[styles.input, styles[size], className].filter(Boolean).join(" ")} data-invalid={Boolean(error) || undefined}>
      {label && <span className={styles.label}>{label}</span>}
      {description && <span className={styles.description}>{description}</span>}
      <span className={styles.fieldWrap}>
        {leading && <span className={styles.leading}>{leading}</span>}
        <Field
          className={[styles.field, leading && styles.hasLeading].filter(Boolean).join(" ")}
          rows={multiline ? rows : undefined}
          {...rest}
        />
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
