import { createId } from "./projectBlockFactory.js";
import { allowedMarks } from "../schema/blockTypes.js";
import { assertProjectDocument } from "../schema/validateProjectDocument.js";

const allowedMarkSet = new Set(allowedMarks);

function cloneDocument(document) {
  return structuredClone(document);
}

function findLocation(blocks, blockId, parentId = null) {
  for (const [index, block] of blocks.entries()) {
    if (block.id === blockId) return { block, blocks, index, parentId };
    const childLocation = findLocation(block.children ?? [], blockId, block.id);
    if (childLocation) return childLocation;
  }
  return null;
}

function getTargetBlocks(document, parentId) {
  if (parentId === null) return document.blocks;
  const parent = findLocation(document.blocks, parentId)?.block;
  if (!parent) throw new Error(`Unknown parent block '${parentId}'`);
  if (!Array.isArray(parent.children)) {
    throw new Error(`Block '${parentId}' cannot contain child blocks`);
  }
  return parent.children;
}

function assertInsertIndex(blocks, index) {
  if (!Number.isInteger(index) || index < 0 || index > blocks.length) {
    throw new Error(
      `Insert index ${index} is outside the valid range 0-${blocks.length}`,
    );
  }
}

export function getBlock(document, blockId) {
  return findLocation(document.blocks, blockId)?.block ?? null;
}

export function getBlockParent(document, blockId) {
  const location = findLocation(document.blocks, blockId);
  if (!location?.parentId) return null;
  return findLocation(document.blocks, location.parentId)?.block ?? null;
}

export function insertBlock(document, { parentId = null, index, block }) {
  const nextDocument = cloneDocument(document);
  const targetBlocks = getTargetBlocks(nextDocument, parentId);
  assertInsertIndex(targetBlocks, index);
  targetBlocks.splice(index, 0, cloneDocument(block));
  return assertProjectDocument(nextDocument);
}

export function updateBlock(document, blockId, update) {
  const nextDocument = cloneDocument(document);
  const location = findLocation(nextDocument.blocks, blockId);
  if (!location) throw new Error(`Unknown block '${blockId}'`);

  const updatedBlock =
    typeof update === "function"
      ? update(cloneDocument(location.block))
      : { ...location.block, ...update };
  if (!updatedBlock || typeof updatedBlock !== "object") {
    throw new Error("Block updater must return a block object");
  }

  location.blocks[location.index] = updatedBlock;
  return assertProjectDocument(nextDocument);
}

export function removeBlock(document, blockId) {
  const nextDocument = cloneDocument(document);
  const location = findLocation(nextDocument.blocks, blockId);
  if (!location) throw new Error(`Unknown block '${blockId}'`);
  location.blocks.splice(location.index, 1);
  return assertProjectDocument(nextDocument);
}

function withFreshIds(block) {
  return {
    ...block,
    id: createId(block.type),
    ...(Array.isArray(block.children)
      ? { children: block.children.map(withFreshIds) }
      : {}),
  };
}

export function duplicateBlock(document, blockId) {
  const nextDocument = cloneDocument(document);
  const location = findLocation(nextDocument.blocks, blockId);
  if (!location) throw new Error(`Unknown block '${blockId}'`);
  const duplicate = withFreshIds(location.block);
  location.blocks.splice(location.index + 1, 0, duplicate);
  return assertProjectDocument(nextDocument);
}

export function ungroupBlock(document, blockId) {
  const nextDocument = cloneDocument(document);
  const location = findLocation(nextDocument.blocks, blockId);
  if (!location) throw new Error(`Unknown block '${blockId}'`);
  if (location.block.type !== "group") {
    throw new Error(`Block '${blockId}' is not a group`);
  }
  if (location.block.variant?.includes("contentSection")) {
    // Every other structural group (textList/media/subContent/...) wraps
    // children that carry their own variant and render fine on their own.
    // A contentSection is different: its display:grid and its children's
    // grid-column placement are a property of the section as a whole, so
    // dissolving it would scramble the layout of everything inside at once.
    throw new Error(`Block '${blockId}' is a content-section grid and cannot be ungrouped`);
  }
  const children = location.block.children ?? [];
  location.blocks.splice(location.index, 1, ...children);
  return assertProjectDocument(nextDocument);
}

// A list item that opens with a heading (see the .text-li h1~h6 rules in
// ProjectRenderer.scss) uses that heading as a label for content that
// keeps going below it, not as "the item's text" - so backspacing at its
// very start should pull just the heading out on its own, not merge it
// into whatever came before and drop the rest of the item.
export function detachListItemHeading(document, blockId) {
  const nextDocument = cloneDocument(document);
  const location = findLocation(nextDocument.blocks, blockId);
  if (!location) throw new Error(`Unknown block '${blockId}'`);
  if (location.block.type !== "group" || !location.block.variant?.includes("textList")) {
    throw new Error(`Block '${blockId}' is not a list item`);
  }
  const [heading, ...rest] = location.block.children ?? [];
  if (heading?.type !== "heading") {
    throw new Error(`Block '${blockId}' does not start with a heading`);
  }
  const replacement = rest.length > 0 ? [heading, { ...location.block, children: rest }] : [heading];
  location.blocks.splice(location.index, 1, ...replacement);
  return assertProjectDocument(nextDocument);
}

export function groupBlocks(document, blockIds) {
  const nextDocument = cloneDocument(document);
  const idSet = new Set(blockIds);
  if (idSet.size < 2) {
    throw new Error("Select at least two blocks to group");
  }

  const locations = [...idSet].map((id) => {
    const location = findLocation(nextDocument.blocks, id);
    if (!location) throw new Error(`Unknown block '${id}'`);
    return location;
  });

  const parentId = locations[0].parentId;
  if (locations.some((location) => location.parentId !== parentId)) {
    throw new Error("Selected blocks must be siblings to group");
  }

  const targetBlocks = locations[0].blocks;
  const selectedEntries = targetBlocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => idSet.has(block.id))
    .sort((a, b) => a.index - b.index);

  const firstIndex = selectedEntries[0].index;
  const newGroup = {
    id: createId("group"),
    type: "group",
    variant: [],
    children: selectedEntries.map(({ block }) => block),
  };

  for (let i = selectedEntries.length - 1; i >= 0; i -= 1) {
    targetBlocks.splice(selectedEntries[i].index, 1);
  }
  targetBlocks.splice(firstIndex, 0, newGroup);

  return assertProjectDocument(nextDocument);
}

export function replaceBlockWithBlocks(document, blockId, blocks) {
  const nextDocument = cloneDocument(document);
  const location = findLocation(nextDocument.blocks, blockId);
  if (!location) throw new Error(`Unknown block '${blockId}'`);
  location.blocks.splice(
    location.index,
    1,
    ...blocks.map((block) => cloneDocument(block)),
  );
  return assertProjectDocument(nextDocument);
}

function findFirstText(block) {
  if (block?.type === "text") return block;
  for (const child of block?.children ?? []) {
    const text = findFirstText(child);
    if (text) return text;
  }
  return null;
}

export function mergeBlockWithPrevious(document, blockId) {
  const nextDocument = cloneDocument(document);
  const location = findLocation(nextDocument.blocks, blockId);
  if (!location || location.index === 0) return nextDocument;
  const currentText = findFirstText(location.block);
  const previousText = findFirstText(location.blocks[location.index - 1]);
  if (!currentText || !previousText) return nextDocument;
  previousText.text = `${previousText.text ?? ""}${currentText.text ?? ""}`;
  location.blocks.splice(location.index, 1);
  return assertProjectDocument(nextDocument);
}

export function moveBlock(document, blockId, { parentId = null, index }) {
  const nextDocument = cloneDocument(document);
  const source = findLocation(nextDocument.blocks, blockId);
  if (!source) throw new Error(`Unknown block '${blockId}'`);

  const [block] = source.blocks.splice(source.index, 1);
  const targetBlocks = getTargetBlocks(nextDocument, parentId);
  const adjustedIndex =
    source.blocks === targetBlocks && source.index < index ? index - 1 : index;
  assertInsertIndex(targetBlocks, adjustedIndex);
  targetBlocks.splice(adjustedIndex, 0, block);
  return assertProjectDocument(nextDocument);
}

export function setTextMarks(document, blockId, marks) {
  if (
    !Array.isArray(marks) ||
    marks.some((mark) => !allowedMarkSet.has(mark))
  ) {
    throw new Error("Text marks contain an unsupported value");
  }
  return updateBlock(document, blockId, (block) => {
    if (block.type !== "text")
      throw new Error(`Block '${blockId}' is not a text block`);
    return { ...block, marks: [...new Set(marks)] };
  });
}

// One-time cleanup for drafts/content created before createTextListBlock
// started giving a list item's body paragraph variant: ["text"] instead of
// []. Without this, an already-saved item's paragraph still renders with
// nothing but the bare project-grid-block class - correct margin today
// (ProjectRenderer.scss matches both forms), but wrong if it's ever pulled
// out of the list on its own (see detachListItemHeading). Only touches
// paragraphs that are direct children of a textList group and still have
// an empty variant; anything already tagged some other way is left alone.
export function normalizeListItemParagraphVariant(document) {
  function normalizeChildren(blocks) {
    return blocks.map((block) => {
      const children = block.children ? normalizeChildren(block.children) : block.children;
      if (block.type === "group" && block.variant?.includes("textList") && children) {
        return {
          ...block,
          children: children.map((child) =>
            child.type === "paragraph" && (child.variant?.length ?? 0) === 0
              ? { ...child, variant: ["text"] }
              : child,
          ),
        };
      }
      return children === block.children ? block : { ...block, children };
    });
  }
  return { ...document, blocks: normalizeChildren(document.blocks) };
}
