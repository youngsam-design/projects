import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getBlock,
  insertBlock,
  mergeBlockWithPrevious,
  moveBlock,
  removeBlock,
  replaceBlockWithBlocks,
  setTextMarks,
  updateBlock,
} from "../src/content/editor/projectDocumentOperations.js";
import { documentHistoryReducer } from "../src/hooks/useDocumentHistory.js";
import {
  createBlocksFromPlainText,
  createCalloutBlock,
  createDividerBlock,
  createListBlock,
  createLinkedParagraphBlock,
  createMediaBlock,
  createQuoteBlock,
  createSpacerBlock,
  convertBlockType,
  duplicateBlock,
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

const duplicated = duplicateBlock(paragraph);
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

console.log("Editor document operations verified.");
