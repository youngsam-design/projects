import Icon from "./Icon";
import styles from "./Checkbox.module.scss";

export default function Checkbox({ className, description, indeterminate = false, label, ...rest }) {
  return (
    <label className={[styles.checkbox, className].filter(Boolean).join(" ")}>
      <span className={styles.row}>
        <span className={styles.box}>
          <input className={styles.input} type="checkbox" {...rest} />
          {indeterminate ? <span className={styles.indeterminate} /> : <Icon className={styles.check} name="check" />}
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </span>
      {description && (
        <span className={styles.descriptionRow}>
          <span className={styles.spacer} />
          <span className={styles.description}>{description}</span>
        </span>
      )}
    </label>
  );
}
