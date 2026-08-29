const variantClasses = {
  summary: "summary",
  intro: "intro",
  content: "content",
  fullMax: "full-max",
  contentSection: "content-section",
  subContent: "sub-content",
  customGroup: "custom-group",
  media: "img-wrap",
  text: "text",
  caption: "caption",
  textList: "text-li",
  bulletList: "bullet-list",
  numberedList: "numbered-list",
  contentImage: "img-in",
  columns: "columns",
  "columns-2": "columns-2",
  "columns-3": "columns-3",
  column: "column",
};

export function getVariantClassName(variants = []) {
  return (
    variants
      .map((variant) => variantClasses[variant])
      .filter(Boolean)
      .join(" ") || undefined
  );
}

export function getMediaClassName(variants, layout) {
  return [getVariantClassName(variants), `media-layout-${layout}`].filter(Boolean).join(" ");
}

export function isMediaBlock(block) {
  return block.type === "image" || block.type === "video";
}

// Media blocks and manually-grouped ("custom") groups are the only blocks
// that keep their own per-block width instead of the shared "본문 너비"
// preset, so they're the only ones that get the drag-to-resize handles.
export function isResizableBlock(block) {
  return isMediaBlock(block) || Boolean(block.variant?.includes("customGroup"));
}

// The project meta (summary) list renders inside the first content-section
// group so it shares that container's grid instead of running its own.
export function findFirstContentSectionId(blocks) {
  for (const block of blocks) {
    if (block.type === "group" && block.variant?.includes("contentSection")) return block.id;
    if (block.children) {
      const found = findFirstContentSectionId(block.children);
      if (found) return found;
    }
  }
  return null;
}

// Text blocks share one project-wide column width (see ProjectSettingsEditor's
// "본문 너비" control) instead of the per-block resize media blocks keep.
const contentWidthPresets = {
  large: { start: 2, span: 12 },
  medium: { start: 3, span: 10 },
  small: { start: 4, span: 8 },
};

export function getTextGridProps(contentWidth = "large") {
  const preset = contentWidthPresets[contentWidth] ?? contentWidthPresets.large;
  return {
    className: "project-grid-block",
    style: { "--block-grid-start": preset.start, "--block-grid-span": preset.span },
  };
}

export function getGridProps(block, contentWidth = "large") {
  if (!isResizableBlock(block)) return getTextGridProps(contentWidth);

  const span = Math.min(14, Math.max(1, block.grid?.span ?? 14));
  const start = Math.floor((14 - span) / 2) + 1;
  return {
    className: "project-grid-block",
    style: { "--block-grid-start": start, "--block-grid-span": span },
  };
}
