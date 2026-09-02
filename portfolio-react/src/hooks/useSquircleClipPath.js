import { useLayoutEffect, useRef, useState } from "react";
import { getSvgPath } from "figma-squircle";

// Approximates native CSS `corner-shape: squircle` (see main.scss's global
// fallback, Chromium-only as of 2026) via figma-squircle's clip-path
// technique, which works in every browser. Reads the element's own computed
// border-radius rather than taking one as a parameter, so the squircle
// always matches whatever radius the component's own CSS already declares -
// one source of truth, no duplicated radius value to keep in sync. Assumes a
// single uniform radius (all four corners the same), which is all today's
// callers (Button, Menu) need.
export function useSquircleClipPath({ cornerSmoothing = 0.6 } = {}) {
  const ref = useRef(null);
  const [clipPath, setClipPath] = useState(undefined);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const update = () => {
      const { width, height } = element.getBoundingClientRect();
      const declaredRadius = Number.parseFloat(getComputedStyle(element).borderRadius);
      // CSS itself clamps an oversized border-radius (e.g. the "circular"
      // pill token) down to half the box - figma-squircle doesn't, so a
      // stadium-shaped button would otherwise get a self-intersecting path.
      const cornerRadius = Number.isFinite(declaredRadius) ? Math.min(declaredRadius, width / 2, height / 2) : 0;
      if (!width || !height || !cornerRadius) {
        setClipPath(undefined);
        return;
      }
      setClipPath(`path('${getSvgPath({ cornerRadius, cornerSmoothing, height, width })}')`);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [cornerSmoothing]);

  return { ref, style: clipPath ? { clipPath } : undefined };
}
