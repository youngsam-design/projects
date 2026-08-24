import { useLayoutEffect, useRef, useState } from "react";
import Icon from "./Icon";
import styles from "./Menu.module.scss";

const VIEWPORT_MARGIN = 8;

// Callers position a menu with a "natural" top/left (next to the button or
// block that opened it) without knowing the menu's own size or how close
// that spot is to the window edge. Once the menu has its real size, nudge it
// back on-screen with a transform - keeps every caller's positioning math
// simple and fixes clipping in one place instead of at each call site.
function useClampToViewport() {
  const ref = useRef(null);
  const [offset, setOffset] = useState(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();

    let dx = 0;
    let dy = 0;
    if (rect.right > window.innerWidth - VIEWPORT_MARGIN) dx = window.innerWidth - VIEWPORT_MARGIN - rect.right;
    if (rect.left + dx < VIEWPORT_MARGIN) dx = VIEWPORT_MARGIN - rect.left;
    if (rect.bottom > window.innerHeight - VIEWPORT_MARGIN) dy = window.innerHeight - VIEWPORT_MARGIN - rect.bottom;
    if (rect.top + dy < VIEWPORT_MARGIN) dy = VIEWPORT_MARGIN - rect.top;

    setOffset(dx || dy ? { dx, dy } : null);
  }, []);

  return { ref, style: offset ? { transform: `translate(${offset.dx}px, ${offset.dy}px)` } : undefined };
}

export default function Menu({ children, className, style, width, ...rest }) {
  const { ref, style: clampStyle } = useClampToViewport();
  return (
    <div
      className={[styles.menu, className].filter(Boolean).join(" ")}
      ref={ref}
      style={width ? { width, ...style, ...clampStyle } : { ...style, ...clampStyle }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function MenuHeader({ eyebrow, title }) {
  return (
    <div className={styles.header}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      {title && <p className={styles.title}>{title}</p>}
    </div>
  );
}

export function MenuSection({ children }) {
  return <div className={styles.section}>{children}</div>;
}

export function MenuSeparator() {
  return (
    <div className={styles.separatorWrap}>
      <div className={styles.separator} />
    </div>
  );
}

export function MenuItem({
  active = false,
  ariaLabel,
  checked = false,
  chevron = false,
  danger = false,
  description,
  disabled = false,
  icon,
  label,
  onMouseDown,
  onSelect,
  shortcut,
}) {
  return (
    <button
      aria-expanded={chevron ? active : undefined}
      aria-label={ariaLabel}
      aria-pressed={checked || (!chevron && active) || undefined}
      className={[styles.item, active && styles.active, danger && styles.danger]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      onClick={onSelect}
      onMouseDown={onMouseDown}
      type="button"
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.body}>
        <span className={styles.row}>
          <span className={styles.label}>{label}</span>
          {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
          {checked && <Icon className={styles.check} name="check" />}
          {chevron && <Icon className={styles.chevron} name="chevronRight" />}
        </span>
        {description && (
          <span className={styles.description}>{description}</span>
        )}
      </span>
    </button>
  );
}
