import Icon from "./Icon";
import styles from "./Select.module.scss";

export default function Select({ children, className, description, error, label, ...rest }) {
  return (
    <label className={[styles.select, className].filter(Boolean).join(" ")} data-invalid={Boolean(error) || undefined}>
      {label && <span className={styles.label}>{label}</span>}
      {description && <span className={styles.description}>{description}</span>}
      <span className={styles.fieldWrap}>
        <select className={styles.field} {...rest}>
          {children}
        </select>
        <Icon className={styles.chevron} name="chevronDown" />
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
