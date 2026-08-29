export const blockTypes = Object.freeze([
  "section",
  "group",
  "heading",
  "paragraph",
  "quote",
  "list",
  "listItem",
  "image",
  "video",
  "text",
  "span",
  "link",
  "lineBreak",
  "divider",
  "spacer",
  "callout",
  "codeBlock",
]);

export const blockTypeSet = new Set(blockTypes);

export const allowedMarks = Object.freeze([
  "bold",
  "semibold",
  "italic",
  "underline",
  "strike",
  "code",
  "highlight",
]);

export const allowedLayouts = Object.freeze(["content", "wide", "full"]);
export const allowedSpacerSizes = Object.freeze(["small", "medium", "large"]);

export const allowedVariants = Object.freeze([
  "summary",
  "intro",
  "content",
  "hidden",
  "fullMax",
  "contentSection",
  "subContent",
  "customGroup",
  "media",
  "text",
  "caption",
  "textList",
  "bulletList",
  "numberedList",
  "contentImage",
  "columns",
  "columns-2",
  "columns-3",
  "column",
]);

export const assetKinds = Object.freeze(["image", "video", "file"]);
export const assetProviders = Object.freeze(["local", "r2", "stream"]);
