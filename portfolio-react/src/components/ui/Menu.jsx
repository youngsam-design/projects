import { useLayoutEffect, useRef, useState } from "react";
import { useSquircleClipPath } from "../../hooks/useSquircleClipPath";
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

// Arrow-key/Home/End navigation among this menu's items, queried live off
// the DOM rather than tracked in state - these menus are small and often
// re-rendered (checked/active items change on every selection), so reading
// role="menuitem" nodes at keydown time is simpler and cheaper than keeping
// a parallel index in sync. Each item keeps its own default tabIndex (still
// individually Tab-reachable) - this only adds the arrow-key layer on top.
function handleMenuKeyDown(event) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const items = Array.from(event.currentTarget.querySelectorAll('[role="menuitem"]:not(:disabled)'));
  if (!items.length) return;
  const currentIndex = items.indexOf(window.document.activeElement);
  let nextIndex;
  if (event.key === "ArrowDown") nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
  else if (event.key === "ArrowUp") nextIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
  else if (event.key === "Home") nextIndex = 0;
  else nextIndex = items.length - 1;
  event.preventDefault();
  items[nextIndex]?.focus();
}

export default function Menu({ children, className, style, width, ...rest }) {
  const { ref: clampRef, style: clampStyle } = useClampToViewport();
  // main.scss's global `corner-shape: squircle` already covers this in
  // Chromium - the clip-path here is what makes the same continuous-corner
  // look show up in Safari/Firefox too. Needs its own ref (figma-squircle
  // has to measure the rendered box), merged with useClampToViewport's via a
  // callback ref since an element can only take one `ref` prop.
  const { ref: squircleRef, style: squircleStyle } = useSquircleClipPath();
  const setRefs = (node) => {
    clampRef.current = node;
    squircleRef.current = node;
  };
  return (
    <div
      className={[styles.menu, className].filter(Boolean).join(" ")}
      onKeyDown={handleMenuKeyDown}
      ref={setRefs}
      role="menu"
      style={width ? { width, ...style, ...clampStyle, ...squircleStyle } : { ...style, ...clampStyle, ...squircleStyle }}
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

export function MenuSection({ children, ...rest }) {
  return (
    <div className={styles.section} {...rest}>
      {children}
    </div>
  );
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
      role="menuitem"
      type="button"
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.body}>
        <span className={styles.row}>
          <span className={styles.label}>{label}</span>
          {/* Checked already means "this is the current one" - the shortcut
              that would apply it has nothing left to offer here, and showing
              both at once just clutters the row. */}
          {shortcut && !checked && <span className={styles.shortcut}>{shortcut}</span>}
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
