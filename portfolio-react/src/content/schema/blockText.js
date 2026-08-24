const richTextParents = new Set([
  "heading",
  "paragraph",
  "quote",
  "span",
  "link",
]);

export function getBlockText(block) {
  return typeof block?.text === "string" ? block.text : "";
}

export function isBlankTextBlock(block) {
  return block?.type === "text" && !getBlockText(block).trim();
}

function normalizeLegacyTextWhitespace(block) {
  if (block?.type !== "text" || typeof block.text !== "string") return block;

  const hasLegacyIndentation =
    /^\s*\n/.test(block.text) ||
    /\n[ \t]{2,}/.test(block.text) ||
    /\n\s*$/.test(block.text);

  if (!hasLegacyIndentation) return block;

  return {
    ...block,
    text: block.text.replace(/[ \t]*\n[ \t]*/g, " ").trim(),
  };
}

export function normalizeStructuralWhitespace(blocks, parentType = null) {
  if (!Array.isArray(blocks)) return [];

  return blocks
    .filter(
      (block) => richTextParents.has(parentType) || !isBlankTextBlock(block),
    )
    .map((block) => {
      const normalizedBlock = normalizeLegacyTextWhitespace(block);

      return Array.isArray(normalizedBlock.children)
        ? {
            ...normalizedBlock,
            children: normalizeStructuralWhitespace(
              normalizedBlock.children,
              normalizedBlock.type,
            ),
          }
        : normalizedBlock;
    });
}

function normalizeContentRows(blocks, parent = null) {
  if (!Array.isArray(blocks)) return [];

  return blocks.flatMap((block) => {
    const normalized = Array.isArray(block.children)
      ? { ...block, children: normalizeContentRows(block.children, block) }
      : block;
    const isSectionContent = parent?.variant?.includes("sectionContent");

    if (!isSectionContent || normalized.type !== "list") return normalized;

    return normalized.children.map((child) => {
      if (child.type !== "listItem") return child;
      const { ordered: _ordered, ...row } = child;
      return { ...row, type: "group" };
    });
  });
}

function mergeContentSections(blocks) {
  const contentSections = blocks.filter(
    (block) => block.type === "section" && block.variant?.includes("content"),
  );
  if (!contentSections.length) return blocks;
  const firstSection = contentSections[0];
  const firstIndex = blocks.indexOf(firstSection);
  const existingContentGroups = contentSections.flatMap((section) =>
    (section.children ?? []).filter((child) =>
      child.variant?.includes("contentSection"),
    ),
  );
  if (contentSections.length === 1 && existingContentGroups.length === 1)
    return blocks;

  const contentRows = contentSections.flatMap((section) => {
    const groups = (section.children ?? []).filter((child) =>
      child.variant?.includes("contentSection"),
    );
    return groups.length
      ? groups.flatMap((group) => group.children ?? [])
      : (section.children ?? []);
  });
  const mergedSection = {
    id:
      contentSections.length === 1
        ? firstSection.id
        : `content-${firstSection.id}`,
    type: "section",
    variant: ["content"],
    children: [
      {
        id:
          existingContentGroups[0]?.id ?? `${firstSection.id}-content-section`,
        type: "group",
        variant: ["contentSection"],
        children: contentRows,
      },
    ],
  };

  return blocks.flatMap((block, index) => {
    if (index === firstIndex) return mergedSection;
    return contentSections.includes(block) ? [] : block;
  });
}

function flattenLegacyContentWrappers(blocks) {
  return blocks.flatMap((block) => {
    const normalized = Array.isArray(block.children)
      ? {
          ...block,
          children: flattenLegacyContentWrappers(block.children),
        }
      : block;
    const wrapper = normalized.variant?.find((variant) =>
      ["sectionTitle", "sectionContent"].includes(variant),
    );

    if (!wrapper) return normalized;

    return (normalized.children ?? []).map((child) => ({
      ...child,
      grid: child.grid ?? {
        span: child.variant?.includes("media") ? 14 : 10,
        align: "center",
      },
    }));
  });
}

export function normalizeProjectDocumentWhitespace(document) {
  const normalizedBlocks = normalizeContentRows(
    normalizeStructuralWhitespace(document.blocks),
  );
  return {
    ...document,
    blocks: flattenLegacyContentWrappers(
      mergeContentSections(normalizedBlocks),
    ),
  };
}
