import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./Cursor.module.scss";

// Evaluated once at module load - this is a browser-only Vite app (no SSR),
// so `window`/`navigator` are always present and the touch-support check
// never needs to change after that.
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

const CursorContext = createContext({
  cursor: { x: 0, y: 0, w: 30, h: 30, isHover: false },
  setCursor: () => {},
});

export function CursorContextProvider({ children }) {
  const [cursor, setCursor] = useState({ x: 0, y: 0, w: 30, h: 30, isHover: false });
  return <CursorContext.Provider value={{ cursor, setCursor }}>{children}</CursorContext.Provider>;
}

function useMousePosition(disabled) {
  const [position, setPosition] = useState({ clientX: 0, clientY: 0 });

  useEffect(() => {
    if (disabled) return;
    const updatePosition = (event) => setPosition({ clientX: event.clientX, clientY: event.clientY });
    document.documentElement.addEventListener("mousemove", updatePosition);
    document.documentElement.addEventListener("mouseenter", updatePosition);
    return () => {
      document.documentElement.removeEventListener("mousemove", updatePosition);
      document.documentElement.removeEventListener("mouseenter", updatePosition);
    };
  }, [disabled]);

  return position;
}

// Enlarges the dot over any link (opt out with `.no-scale`). Delegated on
// `document` instead of querying every `<a>` once on mount, so it keeps
// working for links that appear later - client-side route changes, async
// content - without needing to re-scan the DOM.
function useLinkHoverEnlarge(cursorDotRef, disabled) {
  useEffect(() => {
    if (disabled) return;

    const setEnlarged = (enlarged) => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate(-50%, -50%) scale(${enlarged ? 1.5 : 1})`;
      }
    };
    const handleOver = (event) => {
      const link = event.target.closest("a");
      if (link && !link.classList.contains("no-scale")) setEnlarged(true);
    };
    const handleOut = (event) => {
      const link = event.target.closest("a");
      if (link && !link.classList.contains("no-scale")) setEnlarged(false);
    };

    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);
    return () => {
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
    };
  }, [cursorDotRef, disabled]);
}

// Scoped to the pages this effect was actually built for (project detail
// pages and About) - not the rest of the public site (home), and not the
// editor, which is a CMS tool where precise native cursor feedback matters
// more than the decorative effect. Shared with Button/IconButton so their
// own hover wash can stand down where the cursor is already doing that job.
export function useCursorActive() {
  const { pathname } = useLocation();
  return !isTouchDevice && (pathname.startsWith("/work/") || pathname.startsWith("/about"));
}

export function Cursor() {
  const disabled = !useCursorActive();

  const cursorDot = useRef(null);
  const { clientX, clientY } = useMousePosition(disabled);
  const { cursor } = useContext(CursorContext);
  const [isVisible, setIsVisible] = useState(false);

  useLinkHoverEnlarge(cursorDot, disabled);

  useEffect(() => {
    if (disabled) return;
    // <html>, not <body> - SiteLayout/ProjectEditorPage hard-overwrite
    // `document.body.className` on every theme/page-meta change, which
    // would wipe a class added there right back off.
    document.documentElement.classList.add("hide-native-cursor");
    return () => document.documentElement.classList.remove("hide-native-cursor");
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;
    const show = () => setIsVisible(true);
    const hide = () => setIsVisible(false);
    document.body.addEventListener("mouseenter", show);
    document.body.addEventListener("mouseleave", hide);
    window.addEventListener("mouseover", show);
    return () => {
      document.body.removeEventListener("mouseenter", show);
      document.body.removeEventListener("mouseleave", hide);
      window.removeEventListener("mouseover", show);
    };
  }, [disabled]);

  if (disabled) return null;

  if (!cursor.isHover) {
    cursor.x = clientX;
    cursor.y = clientY;
    cursor.w = 30;
    cursor.h = 30;
  }

  return (
    <div
      ref={cursorDot}
      aria-hidden="true"
      className={[styles.mouse, cursor.isHover && styles.active].filter(Boolean).join(" ")}
      style={{
        width: `${cursor.w}px`,
        height: `${cursor.h}px`,
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        opacity: isVisible && clientX > 1 ? 1 : 0,
      }}
    />
  );
}

// Attach to any element that should expand the cursor to its own bounds
// while hovered (e.g. a card or button, as opposed to the default dot).
export function useCursorHandlers(options = {}) {
  const { setCursor } = useContext(CursorContext);

  const onMouseEnter = useCallback(
    (event) => {
      options.onMouseEnter?.(event);
      // `currentTarget` is the element the handler is actually bound to (the
      // button/link itself); `target` can be whatever child the pointer
      // happens to land on first (an icon, a label span), which shrinks the
      // cursor to that child's bounds instead of snapping to the whole
      // hoverable element.
      const target = event.currentTarget;
      target.classList.add("is-hovered");
      const rect = target.getBoundingClientRect();
      setCursor({
        x: rect.left + target.offsetWidth / 2,
        y: rect.top + target.offsetHeight / 2,
        w: target.offsetWidth,
        h: target.offsetHeight,
        isHover: true,
      });
    },
    [options, setCursor],
  );

  const onMouseLeave = useCallback(
    (event) => {
      options.onMouseLeave?.(event);
      event.currentTarget.classList.remove("is-hovered");
      setCursor({ x: event.clientX, y: event.clientY, w: 30, h: 30, isHover: false });
    },
    [options, setCursor],
  );

  if (isTouchDevice) return options;

  return { onMouseEnter, onMouseLeave };
}
