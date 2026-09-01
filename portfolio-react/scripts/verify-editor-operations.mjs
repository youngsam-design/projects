import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  detachListItemHeading,
  duplicateBlock,
  getBlock,
  getBlockParent,
  groupBlocks,
  indentListItem,
  insertBlock,
  mergeBlockWithPrevious,
  moveBlock,
  normalizeListItemParagraphVariant,
  outdentListItem,
  removeBlock,
  removeBlocks,
  replaceBlockWithBlocks,
  setTextMarks,
  ungroupBlock,
  updateBlock,
} from "../src/content/editor/projectDocumentOperations.js";
import { documentHistoryReducer } from "../src/hooks/useDocumentHistory.js";
import {
  createBlocksFromPlainText,
  createCalloutBlock,
  createDividerBlock,
  createEmbedBlock,
  createHeadingBlock,
  createListBlock,
  createLinkedParagraphBlock,
  createMediaBlock,
  createParagraphBlock,
  createQuoteBlock,
  createSpacerBlock,
  createTableBlock,
  createTextBlock,
  createTextListBlock,
  convertBlockType,
  duplicateBlockNode,
} from "../src/content/editor/projectBlockFactory.js";
import { prepareImportedProjectDocument } from "../src/content/editor/projectDocumentImport.js";
import { createProjectDocument } from "../src/content/schema/projectDocument.js";
import { normalizeProjectDocumentWhitespace } from "../src/content/schema/blockText.js";
import { assertProjectDocument } from "../src/content/schema/validateProjectDocument.js";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const source = JSON.parse(
  await readFile(
    path.join(appRoot, "src/content/projects-v2/1min-return.json"),
    "utf8",
  ),
);
const original = JSON.stringify(source);

const legacyWhitespaceDocument = normalizeProjectDocumentWhitespace({
  ...source,
  blocks: [
    {
      id: "legacy-paragraph",
      type: "paragraph",
      variant: [],
      children: [
        {
          id: "legacy-text",
          type: "text",
          text: "\n    첫 줄\n    둘째 줄\n  ",
          marks: [],
        },
      ],
    },
    {
      id: "soft-break-paragraph",
      type: "paragraph",
      variant: [],
      children: [
        {
          id: "soft-break-text",
          type: "text",
          text: "첫 줄\n둘째 줄",
          marks: [],
        },
      ],
    },
  ],
});

if (
  getBlock(legacyWhitespaceDocument, "legacy-text")?.text !== "첫 줄 둘째 줄" ||
  getBlock(legacyWhitespaceDocument, "soft-break-text")?.text !==
    "첫 줄\n둘째 줄"
) {
  throw new Error("Legacy text whitespace normalization failed");
}

const paragraph = {
  id: "editor-test-paragraph",
  type: "paragraph",
  variant: ["text"],
  children: [
    { id: "editor-test-text", type: "text", text: "새로운 문단", marks: [] },
  ],
};

let document = insertBlock(source, {
  index: source.blocks.length,
  block: paragraph,
});
document = updateBlock(document, "editor-test-text", { text: "수정된 문단" });
document = setTextMarks(document, "editor-test-text", [
  "bold",
  "semibold",
  "bold",
]);
document = moveBlock(document, "editor-test-paragraph", { index: 0 });

if (getBlock(document, "editor-test-text")?.text !== "수정된 문단") {
  throw new Error("Block update verification failed");
}
if (
  getBlock(document, "editor-test-text")?.marks.join(",") !== "bold,semibold"
) {
  throw new Error("Text mark verification failed");
}
if (document.blocks[0]?.id !== "editor-test-paragraph") {
  throw new Error("Block move verification failed");
}

document = removeBlock(document, "editor-test-paragraph");
if (getBlock(document, "editor-test-paragraph")) {
  throw new Error("Block removal verification failed");
}
if (JSON.stringify(source) !== original) {
  throw new Error("Document operations mutated the source document");
}

const convertedHeading = convertBlockType(paragraph, "heading-2");
const convertedList = convertBlockType(convertedHeading, "text-list");
const convertedParagraph = convertBlockType(convertedList, "paragraph");
if (
  convertedHeading.type !== "heading" ||
  convertedHeading.level !== 2 ||
  convertedList.type !== "group" ||
  !convertedList.variant.includes("textList") ||
  convertedParagraph.children[0].text !== "새로운 문단"
) {
  throw new Error("Block type conversion verification failed");
}

const pastedBlocks = createBlocksFromPlainText(
  "## 붙여넣은 제목\n- 글머리 항목\n1. 번호 항목\n본문",
);
if (
  pastedBlocks[0].type !== "heading" ||
  pastedBlocks[0].level !== 2 ||
  !pastedBlocks[1].variant.includes("bulletList") ||
  !pastedBlocks[2].variant.includes("numberedList") ||
  pastedBlocks[3].type !== "paragraph"
) {
  throw new Error("Plain text paste conversion verification failed");
}

const replacementSource = insertBlock(source, {
  index: source.blocks.length,
  block: paragraph,
});
const replacementParagraph = {
  ...createBlocksFromPlainText("교체된 문단")[0],
  id: paragraph.id,
};
const replacedDocument = replaceBlockWithBlocks(
  replacementSource,
  paragraph.id,
  [replacementParagraph],
);
if (getBlock(replacedDocument, paragraph.id)?.type !== "paragraph") {
  throw new Error("Block replacement verification failed");
}

const mergeFirst = createBlocksFromPlainText("첫 문단")[0];
const mergeSecond = createBlocksFromPlainText("둘째 문단")[0];
let mergeDocument = insertBlock(source, {
  index: source.blocks.length,
  block: mergeFirst,
});
mergeDocument = insertBlock(mergeDocument, {
  index: mergeDocument.blocks.length,
  block: mergeSecond,
});
mergeDocument = mergeBlockWithPrevious(mergeDocument, mergeSecond.id);
if (
  getBlock(mergeDocument, mergeFirst.children[0].id)?.text !==
    "첫 문단둘째 문단" ||
  getBlock(mergeDocument, mergeSecond.id)
) {
  throw new Error("Backspace block merge verification failed");
}

let rejectedDuplicate = false;
try {
  insertBlock(source, { index: 0, block: structuredClone(source.blocks[0]) });
} catch {
  rejectedDuplicate = true;
}
if (!rejectedDuplicate) throw new Error("Duplicate block ID was not rejected");

const duplicated = duplicateBlockNode(paragraph);
if (
  duplicated.id === paragraph.id ||
  duplicated.children[0].id === paragraph.children[0].id
) {
  throw new Error("Duplicated block IDs were not renewed recursively");
}

const imported = prepareImportedProjectDocument(
  JSON.stringify({ ...source, version: 99 }),
  source,
);
if (imported.version !== source.version) {
  throw new Error(
    "Imported document did not preserve the current server version",
  );
}
let rejectedForeignProject = false;
try {
  prepareImportedProjectDocument(
    { ...source, projectId: "another-project" },
    source,
  );
} catch {
  rejectedForeignProject = true;
}
if (!rejectedForeignProject) {
  throw new Error("Foreign project import was not rejected");
}

const expandedBlocksDocument = insertBlock(
  insertBlock(source, {
    index: source.blocks.length,
    block: createQuoteBlock(),
  }),
  {
    index: source.blocks.length + 1,
    block: createListBlock(),
  },
);
if (
  expandedBlocksDocument.blocks.at(-2).type !== "quote" ||
  expandedBlocksDocument.blocks.at(-1).type !== "list"
) {
  throw new Error("Quote and list block creation verification failed");
}

let rejectedInvalidCaption = false;
try {
  const imageAsset = source.assets.find((asset) => asset.kind === "image");
  const mediaBlock = createMediaBlock(imageAsset.id, "image");
  mediaBlock.caption = 123;
  insertBlock(source, { index: source.blocks.length, block: mediaBlock });
} catch {
  rejectedInvalidCaption = true;
}
if (!rejectedInvalidCaption) {
  throw new Error("Invalid media caption was not rejected");
}

let layoutBlocksDocument = source;
for (const factory of [
  createCalloutBlock,
  createDividerBlock,
  createSpacerBlock,
]) {
  layoutBlocksDocument = insertBlock(layoutBlocksDocument, {
    index: layoutBlocksDocument.blocks.length,
    block: factory(),
  });
}
if (
  layoutBlocksDocument.blocks
    .slice(-3)
    .map((block) => block.type)
    .join(",") !== "callout,divider,spacer"
) {
  throw new Error("Layout block creation verification failed");
}

const linkedParagraph = createLinkedParagraphBlock();
const linkedDocument = insertBlock(source, {
  index: source.blocks.length,
  block: linkedParagraph,
});
if (linkedDocument.blocks.at(-1).children[0].type !== "link") {
  throw new Error("Linked paragraph creation verification failed");
}
let rejectedUnsafeLink = false;
try {
  insertBlock(source, {
    index: source.blocks.length,
    block: {
      ...linkedParagraph,
      id: "unsafe-link-paragraph",
      children: [
        {
          ...linkedParagraph.children[0],
          id: "unsafe-link",
          href: "javascript:alert(1)",
          children: [
            {
              ...linkedParagraph.children[0].children[0],
              id: "unsafe-link-text",
            },
          ],
        },
      ],
    },
  });
} catch {
  rejectedUnsafeLink = true;
}
if (!rejectedUnsafeLink) throw new Error("Unsafe link URL was not rejected");

const blankProject = createProjectDocument({
  projectId: "prj_new-project",
  slug: "new-project",
  title: "새 프로젝트",
});
assertProjectDocument(blankProject);
if (blankProject.hero.coverAssetId !== blankProject.assets[0].id) {
  throw new Error("New project cover asset was not initialized");
}

const historyInitial = {
  past: [],
  present: { version: 7, title: "처음" },
  future: [],
  lastChange: null,
};
const historyChanged = documentHistoryReducer(historyInitial, {
  type: "change",
  update: (current) => ({ ...current, title: "수정" }),
  historyKey: null,
  timestamp: 1,
});
const historyUndone = documentHistoryReducer(historyChanged, { type: "undo" });
const historyRedone = documentHistoryReducer(historyUndone, { type: "redo" });
if (
  historyUndone.present.title !== "처음" ||
  historyUndone.present.version !== 7
) {
  throw new Error("Undo did not preserve the server document version");
}
if (
  historyRedone.present.title !== "수정" ||
  historyRedone.present.version !== 7
) {
  throw new Error("Redo verification failed");
}

// getBlockParent
const parentTestGroup = {
  id: "parent-test-group",
  type: "group",
  variant: ["customGroup"],
  children: [createParagraphBlock()],
};
const parentTestDocument = insertBlock(source, {
  index: source.blocks.length,
  block: parentTestGroup,
});
if (getBlockParent(parentTestDocument, parentTestGroup.children[0].id)?.id !== parentTestGroup.id) {
  throw new Error("getBlockParent did not resolve a nested block's parent");
}
if (getBlockParent(parentTestDocument, parentTestGroup.id) !== null) {
  throw new Error("getBlockParent did not return null for a root-level block");
}

// removeBlocks - removes several ids in one pass and silently skips one
// that's already gone (e.g. a child whose selected parent was removed first).
const removeBlocksA = createParagraphBlock();
const removeBlocksB = createParagraphBlock();
let removeBlocksDocument = insertBlock(source, { index: source.blocks.length, block: removeBlocksA });
removeBlocksDocument = insertBlock(removeBlocksDocument, { index: removeBlocksDocument.blocks.length, block: removeBlocksB });
removeBlocksDocument = removeBlocks(removeBlocksDocument, [removeBlocksA.id, removeBlocksB.id, "already-gone"]);
if (getBlock(removeBlocksDocument, removeBlocksA.id) || getBlock(removeBlocksDocument, removeBlocksB.id)) {
  throw new Error("removeBlocks did not remove every requested block");
}

// duplicateBlock (document-level, distinct from projectBlockFactory's duplicateBlockNode)
const duplicateSourceBlock = createParagraphBlock();
duplicateSourceBlock.children = [createTextBlock("복제할 문단")];
let duplicateDocument = insertBlock(source, { index: source.blocks.length, block: duplicateSourceBlock });
const duplicateSourceIndex = duplicateDocument.blocks.findIndex((block) => block.id === duplicateSourceBlock.id);
duplicateDocument = duplicateBlock(duplicateDocument, duplicateSourceBlock.id);
const duplicatedSibling = duplicateDocument.blocks[duplicateSourceIndex + 1];
if (
  duplicatedSibling?.id === duplicateSourceBlock.id ||
  duplicatedSibling?.children[0]?.text !== "복제할 문단" ||
  !getBlock(duplicateDocument, duplicateSourceBlock.id)
) {
  throw new Error("Document-level duplicateBlock did not insert a fresh-id copy right after the original");
}

// groupBlocks / ungroupBlock
const groupTestA = createParagraphBlock();
const groupTestB = createParagraphBlock();
let groupTestDocument = insertBlock(source, { index: source.blocks.length, block: groupTestA });
groupTestDocument = insertBlock(groupTestDocument, { index: groupTestDocument.blocks.length, block: groupTestB });
groupTestDocument = groupBlocks(groupTestDocument, [groupTestA.id, groupTestB.id]);
const createdGroup = getBlockParent(groupTestDocument, groupTestA.id);
if (
  !createdGroup ||
  createdGroup.type !== "group" ||
  !createdGroup.variant?.includes("customGroup") ||
  createdGroup.children.length !== 2
) {
  throw new Error("groupBlocks did not wrap the selected siblings in a new group");
}
const ungroupedDocument = ungroupBlock(groupTestDocument, createdGroup.id);
if (getBlockParent(ungroupedDocument, groupTestA.id) !== null || !getBlock(ungroupedDocument, groupTestB.id)) {
  throw new Error("ungroupBlock did not splice the group's children back in place");
}
let rejectedContentSectionUngroup = false;
try {
  ungroupBlock(
    {
      ...source,
      blocks: [...source.blocks, { id: "content-section-ungroup-test", type: "group", variant: ["contentSection"], children: [] }],
    },
    "content-section-ungroup-test",
  );
} catch {
  rejectedContentSectionUngroup = true;
}
if (!rejectedContentSectionUngroup) {
  throw new Error("ungroupBlock did not reject dissolving a contentSection grid group");
}

// indentListItem / outdentListItem
const listItemFirst = createTextListBlock("첫 항목");
const listItemSecond = createTextListBlock("둘째 항목");
let listNestingDocument = insertBlock(source, { index: source.blocks.length, block: listItemFirst });
listNestingDocument = insertBlock(listNestingDocument, { index: listNestingDocument.blocks.length, block: listItemSecond });
listNestingDocument = indentListItem(listNestingDocument, listItemSecond.id);
if (getBlockParent(listNestingDocument, listItemSecond.id)?.id !== listItemFirst.id) {
  throw new Error("indentListItem did not nest the item under its previous sibling");
}
listNestingDocument = outdentListItem(listNestingDocument, listItemSecond.id);
if (getBlockParent(listNestingDocument, listItemSecond.id) !== null) {
  throw new Error("outdentListItem did not pull the item back out to the top level");
}
const listItemIndex = listNestingDocument.blocks.findIndex((block) => block.id === listItemFirst.id);
if (listNestingDocument.blocks[listItemIndex + 1]?.id !== listItemSecond.id) {
  throw new Error("outdentListItem did not place the item right after its former parent");
}

// detachListItemHeading
const headingListItem = createTextListBlock("본문");
headingListItem.children = [
  { ...createHeadingBlock(), children: [createTextBlock("항목 제목")] },
  ...headingListItem.children,
];
let headingListDocument = insertBlock(source, { index: source.blocks.length, block: headingListItem });
const headingListIndex = headingListDocument.blocks.findIndex((block) => block.id === headingListItem.id);
headingListDocument = detachListItemHeading(headingListDocument, headingListItem.id);
if (
  headingListDocument.blocks[headingListIndex]?.type !== "heading" ||
  headingListDocument.blocks[headingListIndex + 1]?.id !== headingListItem.id ||
  headingListDocument.blocks[headingListIndex + 1]?.children.length !== 1
) {
  throw new Error("detachListItemHeading did not split the heading out into its own sibling block");
}

// normalizeListItemParagraphVariant - one-time migration for list items saved
// before createTextListBlock started tagging their paragraph variant: ["text"]
const legacyListItem = createTextListBlock("레거시 항목");
legacyListItem.children[0].variant = [];
const normalized = normalizeListItemParagraphVariant({ ...source, blocks: [...source.blocks, legacyListItem] });
const normalizedItem = normalized.blocks.at(-1);
if (normalizedItem.children[0].variant.join(",") !== "text") {
  throw new Error("normalizeListItemParagraphVariant did not tag the legacy paragraph's variant");
}

// table / embed block creation
const tableBlock = createTableBlock(2, 3);
let tableDocument = insertBlock(source, { index: source.blocks.length, block: tableBlock });
if (
  tableDocument.blocks.at(-1).children.length !== 2 ||
  tableDocument.blocks.at(-1).children[0].children.length !== 3 ||
  tableDocument.blocks.at(-1).children[0].children[0].type !== "tableCell"
) {
  throw new Error("Table block creation verification failed");
}
const tableConverted = convertBlockType(tableDocument.blocks.at(-1), "embed");
if (tableConverted.type !== "embed") {
  throw new Error("Block type conversion to embed verification failed");
}

const embedBlock = createEmbedBlock("https://example.com/embed");
let embedDocument = insertBlock(source, { index: source.blocks.length, block: embedBlock });
if (embedDocument.blocks.at(-1).url !== "https://example.com/embed") {
  throw new Error("Embed block creation verification failed");
}
let rejectedUnsafeEmbedUrl = false;
try {
  insertBlock(source, {
    index: source.blocks.length,
    block: { ...createEmbedBlock("javascript:alert(1)"), id: "unsafe-embed" },
  });
} catch {
  rejectedUnsafeEmbedUrl = true;
}
if (!rejectedUnsafeEmbedUrl) throw new Error("Unsafe embed URL was not rejected");

// A freshly-inserted embed (the "+" menu's default, before the author has
// filled in a URL) must stay valid with an empty url - this used to throw
// inside the history reducer and crash the whole editor to a blank page.
const blankEmbedDocument = insertBlock(source, {
  index: source.blocks.length,
  block: { ...createEmbedBlock(), id: "blank-embed" },
});
if (getBlock(blankEmbedDocument, "blank-embed")?.url !== "") {
  throw new Error("A freshly inserted embed block with no url was rejected");
}

console.log("Editor document operations verified.");
