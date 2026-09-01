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

// A numbered list item's displayed number ("1.", "2.", ...) is its 1-based
// position among the numberedList siblings that precede it in the SAME
// children array. Since nested list items (added via Tab/indent) live in
// their own list item's `children`, this naturally restarts at 1 for each
// nesting level while still counting continuously across other block types
// at the top level - no CSS counter-scoping involved.
export function getNumberedListPosition(siblings, index) {
  let position = 1;
  for (let i = 0; i < index; i += 1) {
    const sibling = siblings[i];
    if (sibling?.type === "group" && sibling.variant?.includes("numberedList")) position += 1;
  }
  return position;
}

export function isMediaBlock(block) {
  return block.type === "image" || block.type === "video";
}

// Single source of truth for block-type -> HTML tag, shared by the read-mode
// renderer (ProjectRenderer.jsx) and the WYSIWYG editor canvas
// (WysiwygProjectCanvas.jsx) so the two never drift - they previously kept
// separate copies of this map and one was missing "span", which made span
// blocks render fine in the editor but silently disappear on the public page.
const blockTags = {
  section: "section",
  group: "div",
  listItem: "li",
  callout: "aside",
  span: "span",
  table: "table",
  tableRow: "tr",
  tableCell: "td",
};

export function getBlockTag(block) {
  if (block.type === "list") return block.ordered ? "ol" : "ul";
  return blockTags[block.type];
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
