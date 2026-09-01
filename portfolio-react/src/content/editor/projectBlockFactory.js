export function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createTextBlock(text = "") {
  return { id: createId("text"), type: "text", text, marks: [] };
}

export function createLinkBlock(text = "링크", href = "https://example.com") {
  return {
    id: createId("link"),
    type: "link",
    href,
    newTab: true,
    variant: [],
    children: [createTextBlock(text)],
  };
}

export function createParagraphBlock() {
  return {
    id: createId("paragraph"),
    type: "paragraph",
    variant: ["text"],
    children: [createTextBlock("")],
  };
}

export function createHeadingBlock() {
  return {
    id: createId("heading"),
    type: "heading",
    level: 3,
    variant: [],
    children: [createTextBlock("새로운 제목")],
  };
}

export function createQuoteBlock() {
  return {
    id: createId("quote"),
    type: "quote",
    variant: [],
    children: [createTextBlock("인용문을 입력하세요.")],
  };
}

export function createListItemBlock(text = "새로운 목록 항목") {
  return {
    id: createId("listItem"),
    type: "listItem",
    variant: ["textList"],
    children: [
      {
        id: createId("paragraph"),
        type: "paragraph",
        variant: [],
        children: [createTextBlock(text)],
      },
    ],
  };
}

export function createListBlock() {
  return {
    id: createId("list"),
    type: "list",
    ordered: false,
    variant: ["text"],
    children: [createListItemBlock()],
  };
}

export function createDividerBlock() {
  return { id: createId("divider"), type: "divider", variant: [] };
}

export function createSpacerBlock() {
  return {
    id: createId("spacer"),
    type: "spacer",
    size: "medium",
    variant: [],
  };
}

export function createCodeBlock(language = "javascript") {
  return { id: createId("codeBlock"), type: "codeBlock", language, code: "", variant: [] };
}

export function createCalloutBlock() {
  return {
    id: createId("callout"),
    type: "callout",
    variant: [],
    children: [
      {
        id: createId("paragraph"),
        type: "paragraph",
        variant: [],
        children: [createTextBlock("강조할 내용을 입력하세요.")],
      },
    ],
  };
}

export function createColumnBlock() {
  return {
    id: createId("group"),
    type: "group",
    variant: ["column"],
    children: [createParagraphBlock()],
  };
}

export function createColumnsBlock(count = 2) {
  return {
    id: createId("group"),
    type: "group",
    variant: ["columns", count === 3 ? "columns-3" : "columns-2"],
    children: Array.from({ length: count }, createColumnBlock),
  };
}

export function createTableCellBlock() {
  return {
    id: createId("tableCell"),
    type: "tableCell",
    variant: [],
    children: [createParagraphBlock()],
  };
}

export function createTableRowBlock(columns = 2) {
  return {
    id: createId("tableRow"),
    type: "tableRow",
    variant: [],
    children: Array.from({ length: columns }, createTableCellBlock),
  };
}

export function createTableBlock(rows = 2, columns = 2) {
  return {
    id: createId("table"),
    type: "table",
    variant: [],
    children: Array.from({ length: rows }, () => createTableRowBlock(columns)),
  };
}

export function createEmbedBlock(url = "") {
  return { id: createId("embed"), type: "embed", url, variant: [] };
}

export function createLinkedParagraphBlock() {
  return {
    id: createId("paragraph"),
    type: "paragraph",
    variant: ["text"],
    children: [createLinkBlock("링크 텍스트")],
  };
}

export function createTextListBlock(text = "목록 항목", ordered = false) {
  return {
    id: createId("group"),
    type: "group",
    variant: ["textList", ordered ? "numberedList" : "bulletList"],
    children: [
      {
        // Keep the normal ["text"] variant (not []) so this paragraph still
        // reads as ordinary body text if it's ever pulled out of the list
        // item on its own (see detachListItemHeading) - ProjectRenderer.scss
        // gives it its own margin while it's still inside a .text-li.
        ...createParagraphBlock(),
        children: [createTextBlock(text)],
      },
    ],
  };
}

export function createBlocksFromPlainText(value) {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  return lines.map((line) => {
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const block = createHeadingBlock();
      block.level = heading[1].length;
      block.children = [createTextBlock(heading[2])];
      return block;
    }
    const bullet = line.match(/^[-*+]\s+(.*)$/);
    if (bullet) return createTextListBlock(bullet[1], false);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) return createTextListBlock(numbered[1], true);
    const paragraph = createParagraphBlock();
    paragraph.children = [createTextBlock(line)];
    return paragraph;
  });
}

export function createMediaBlock(assetId, kind) {
  const base = {
    id: createId(kind),
    type: kind,
    assetId,
    layout: "content",
    variant: ["contentImage"],
    caption: null,
    frame: false,
    frameBackgroundAssetId: null,
    framePaddingTop: false,
    framePaddingBottom: false,
    framePaddingLeft: false,
    framePaddingRight: false,
  };
  if (kind === "image") return { ...base, alt: "" };
  return {
    ...base,
    playback: { controls: true, autoplay: false, muted: false, loop: false },
  };
}

function getPlainText(block) {
  if (block.type === "text") return block.text ?? "";
  return (block.children ?? []).map(getPlainText).filter(Boolean).join(" ");
}

export function getBlockTypeValue(block) {
  if (block.type === "heading") return `heading-${block.level}`;
  if (block.type === "group" && block.variant?.includes("textList"))
    return block.variant.includes("numberedList")
      ? "numbered-list"
      : block.variant.includes("bulletList")
        ? "bullet-list"
        : "text-list";
  if (["image", "video"].includes(block.type)) return "media";
  return block.type;
}

export function convertBlockType(block, targetType) {
  const text = getPlainText(block);
  const shared = {
    id: block.id,
    ...(block.grid ? { grid: block.grid } : {}),
  };
  const richChildren = () => [createTextBlock(text)];

  if (targetType.startsWith("heading-")) {
    return {
      ...shared,
      type: "heading",
      level: Number(targetType.split("-")[1]),
      variant: [],
      children: richChildren(),
    };
  }
  if (targetType === "paragraph") {
    return {
      ...shared,
      type: "paragraph",
      variant: ["text"],
      children: richChildren(),
    };
  }
  if (targetType === "quote") {
    return {
      ...shared,
      type: "quote",
      variant: [],
      children: richChildren(),
    };
  }
  if (targetType === "callout") {
    return {
      ...shared,
      type: "callout",
      variant: [],
      children: [
        {
          ...createParagraphBlock(),
          variant: [],
          children: richChildren(),
        },
      ],
    };
  }
  if (["text-list", "bullet-list", "numbered-list"].includes(targetType)) {
    const list = createTextListBlock(text, targetType === "numbered-list");
    return {
      ...list,
      ...shared,
      variant: targetType === "text-list" ? ["textList"] : list.variant,
    };
  }
  if (["columns-2", "columns-3"].includes(targetType)) {
    const columns = createColumnsBlock(targetType === "columns-3" ? 3 : 2);
    if (text.trim()) {
      columns.children[0] = {
        ...columns.children[0],
        children: [{ ...createParagraphBlock(), children: richChildren() }],
      };
    }
    return { ...columns, ...shared };
  }
  if (targetType === "group") {
    return {
      ...shared,
      type: "group",
      variant: [],
      children:
        block.type === "group"
          ? structuredClone(block.children ?? [])
          : [
              {
                ...createParagraphBlock(),
                variant: [],
                children: richChildren(),
              },
            ],
    };
  }
  if (targetType === "divider") {
    return { ...shared, type: "divider", variant: [] };
  }
  if (targetType === "spacer") {
    return { ...shared, type: "spacer", size: "medium", variant: [] };
  }
  if (targetType === "codeBlock") {
    return { ...shared, type: "codeBlock", language: "javascript", code: text, variant: [] };
  }
  if (targetType === "table") {
    const table = createTableBlock();
    if (text.trim()) {
      table.children[0].children[0] = {
        ...table.children[0].children[0],
        children: richChildren(),
      };
    }
    return { ...table, ...shared };
  }
  if (targetType === "embed") {
    return { ...shared, type: "embed", url: "", variant: [] };
  }

  throw new Error(`지원하지 않는 블록 유형 '${targetType}'입니다.`);
}

export function createUploadedAsset(file, kind) {
  const id = createId("asset");
  return {
    id,
    kind,
    provider: "local",
    src: `editor-asset://${id}`,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    editorOwned: true,
  };
}

// Duplicates a bare block (no document/parent context needed) - distinct
// from projectDocumentOperations.js's duplicateBlock(document, blockId),
// which is the one the editor UI actually calls to duplicate a block in
// place within a document.
export function duplicateBlockNode(block) {
  const duplicate = structuredClone(block);
  const renewIds = (current) => {
    current.id = createId(current.type);
    current.children?.forEach(renewIds);
    return current;
  };
  return renewIds(duplicate);
}
