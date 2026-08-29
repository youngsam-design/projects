import { createElement, useEffect, useRef, useState } from "react";
import { getBlockText, isBlankTextBlock } from "../../content/schema/blockText";
import { getCodeLanguageLabel } from "../../content/schema/codeLanguages";
import { formatCode } from "../../content/editor/formatCode";
import { getBlockTypeValue } from "../../content/editor/projectBlockFactory";
import { getProjectAsset, resolveProjectAssetUrl } from "../project/projectAssets";
import FrameBox from "../project/blocks/FrameBox";
import ProjectMeta from "../project/ProjectMeta";
import RelatedProjects from "../project/RelatedProjects";
import {
  findFirstContentSectionId,
  getGridProps,
  getMediaClassName,
  getVariantClassName,
  isMediaBlock,
  isResizableBlock,
} from "../project/blocks/blockVariants";
import Footer from "../layout/Footer";
import Icon from "../ui/Icon";
import Menu, { MenuHeader, MenuItem, MenuSection, MenuSeparator } from "../ui/Menu";
import styles from "./WysiwygProjectCanvas.module.scss";

function getTextClassName(marks = []) {
  return marks.map((mark) => `mark-${mark}`).join(" ");
}

const blockTypeOptions = [
  { value: "paragraph", label: "텍스트", icon: "text", shortcut: "" },
  { value: "heading-1", label: "제목 1", icon: "heading1", shortcut: "#" },
  { value: "heading-2", label: "제목 2", icon: "heading2", shortcut: "##" },
  { value: "heading-3", label: "제목 3", icon: "heading3", shortcut: "###" },
  { value: "heading-4", label: "제목 4", icon: "heading4", shortcut: "####" },
  { value: "heading-5", label: "제목 5", icon: "heading5", shortcut: "" },
  { value: "heading-6", label: "제목 6", icon: "heading6", shortcut: "" },
  { value: "bullet-list", label: "글머리 기호 목록", icon: "bulletList", shortcut: "-" },
  { value: "numbered-list", label: "번호 매기기 목록", icon: "numberedList", shortcut: "1." },
  { value: "quote", label: "인용", icon: "quote", shortcut: "" },
  { value: "callout", label: "콜아웃", icon: "callout", shortcut: "" },
  { value: "codeBlock", label: "코드 블록", icon: "codeBlock", shortcut: "" },
  { value: "divider", label: "구분선", icon: "divider", shortcut: "" },
  { value: "spacer", label: "간격", icon: "spacer", shortcut: "" },
  { value: "media", label: "이미지 또는 영상", icon: "media", shortcut: "" },
  { value: "columns-2", label: "2단 분할", icon: "columns2", shortcut: "" },
  { value: "columns-3", label: "3단 분할", icon: "columns3", shortcut: "" },
];

function matchMarkdownShortcut(prefix) {
  if (/^#{1,4}$/.test(prefix)) return `heading-${prefix.length}`;
  if (/^[-*]$/.test(prefix)) return "bullet-list";
  if (/^\d+\.$/.test(prefix)) return "numbered-list";
  if (prefix === ">") return "quote";
  return null;
}

function findBlock(blocks, blockId) {
  for (const block of blocks) {
    if (block.id === blockId) return block;
    const child = findBlock(block.children ?? [], blockId);
    if (child) return child;
  }
  return null;
}

function findParentBlock(blocks, blockId, parent = null) {
  for (const block of blocks) {
    if (block.id === blockId) return parent;
    const found = findParentBlock(block.children ?? [], blockId, block);
    if (found) return found;
  }
  return null;
}

// Walks up from a text selection's own leaf ("text") block through purely
// inline wrappers (span/link/lineBreak) to the nearest block that actually
// has its own "type" a user could switch (paragraph, heading, quote, ...).
// That's what the inline toolbar's type-change submenu should act on, not
// the raw text node the selection itself lives in.
const inlineWrapperTypes = new Set(["text", "span", "link", "lineBreak"]);
function findConvertibleAncestor(blocks, blockId) {
  let currentId = blockId;
  for (let depth = 0; depth < 10; depth += 1) {
    const parent = findParentBlock(blocks, currentId);
    if (!parent) return null;
    if (!inlineWrapperTypes.has(parent.type)) return parent;
    currentId = parent.id;
  }
  return null;
}

// text-li/sub-content 같은 구조적 그룹의 자식들(리스트 항목의 문단, 이미지)은
// 전부 자기 자신의 variant를 갖고 있어서 - 해제해도 project-grid-block만 남는
// 맨몸이 되지 않는다(createTextListBlock이 문단에 variant: ["text"]를 주도록
// 고친 뒤로는 리스트 항목도 마찬가지). content-section만 예외다 - 그 grid
// 레이아웃(display:grid, 자식들의 grid-column 배치)은 section 전체에 걸린
// 것이라, 해제하면 안의 모든 콘텐츠가 한꺼번에 배치가 깨진다. 그래서 이것만
// 남겨서 막아둔다.
function isUngroupableGroup(block) {
  return block?.type === "group" && !block.variant?.includes("contentSection") && !block.variant?.includes("columns") && !block.variant?.includes("column");
}

// A "columns" group (2 or 3 side-by-side slots) and each "column" group
// inside it both need the same recursive treatment as contentSection - every
// block placed in a column must keep its own insert/select/drag affordances,
// not the shallower one-level recursion EditableBlock gives plain groups.
function isRecursiveContainer(block) {
  return (
    block.type === "section" ||
    (block.type === "group" && (block.variant?.includes("contentSection") || block.variant?.includes("columns") || block.variant?.includes("column")))
  );
}

function getSelectionOffsets(element) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return { start: 0, end: 0 };
  const range = selection.getRangeAt(0);
  const startRange = range.cloneRange();
  startRange.selectNodeContents(element);
  startRange.setEnd(range.startContainer, range.startOffset);
  const endRange = range.cloneRange();
  endRange.selectNodeContents(element);
  endRange.setEnd(range.endContainer, range.endOffset);
  return {
    start: startRange.toString().length,
    end: endRange.toString().length,
  };
}

function setCaret(element, offset) {
  const selection = window.getSelection();
  const range = document.createRange();
  const node = element.firstChild ?? element;
  const domText = node.textContent ?? "";
  // If the rendered text carries the invisible soft-break caret anchor and
  // the caller asked for "the end of the real text" (right before it), land
  // past the anchor instead so typing continues on the new line, not before it.
  const targetOffset = domText.endsWith(softBreakCaretAnchor) && offset >= domText.length - 1 ? domText.length : offset;
  range.setStart(node, Math.min(targetOffset, domText.length));
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  element.focus();
}

// Plain-text-only insertion at the current caret - used by the code block's
// paste/Tab handling, where content has no marks and the DOM itself (not a
// text-offset model) is the source of truth during editing.
function insertTextAtCaret(text) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = window.document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

// A bare trailing "\n" (nothing after it) makes Chromium insert newly typed
// text *before* that newline instead of after it - the browser treats a
// dangling final line break as having no line to type into. Padding the
// rendered text with an invisible zero-width space anchors the caret past
// the break so typing lands on the new line as expected. The marker never
// gets persisted - every read of the live DOM strips it back off first.
const softBreakCaretAnchor = "​";

function withCaretAnchor(text) {
  return text.endsWith("\n") ? `${text}${softBreakCaretAnchor}` : text;
}

function readLiveText(element) {
  // Strip every occurrence, not just a trailing one: once the user types past
  // the anchor it ends up stranded mid-string (right after the "\n"), and it
  // must never survive into persisted content either way.
  return (element.textContent ?? "").replaceAll(softBreakCaretAnchor, "");
}

function EditableText({ block, context, onBackspace, onEnter, onMarkdownShortcut, onPaste, onSlash, onSoftBreak, onTextChange, onTextSelection }) {
  const text = getBlockText(block);
  const skipBlurRef = useRef(false);

  return (
    <span
      className={getTextClassName(block.marks)}
      contentEditable
      data-text-block-id={block.id}
      data-placeholder="텍스트를 입력하거나 '/'로 블록을 추가하세요."
      onBlur={(event) => {
        if (skipBlurRef.current) return;
        onTextChange(block.id, readLiveText(event.currentTarget));
      }}
      onKeyDown={(event) => {
        // While a Korean/Japanese/Chinese IME composition is in progress, the
        // browser can dispatch a keydown with key "Enter" (or keyCode 229) to
        // confirm the composing syllable rather than to submit the block. If
        // this handler still intercepts it, it splits/moves text using a
        // `value` snapshot that doesn't yet include the uncommitted
        // composition, which reads as existing text jumping to the next block.
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        const value = readLiveText(event.currentTarget);
        const rawSelection = getSelectionOffsets(event.currentTarget);
        const selection = {
          start: Math.min(rawSelection.start, value.length),
          end: Math.min(rawSelection.end, value.length),
        };
        if (event.key === "/" && !value.trim()) {
          event.preventDefault();
          onSlash(context, event.currentTarget);
        } else if (event.key === " " && selection.start === selection.end) {
          const prefix = value.slice(0, selection.start);
          const kind = matchMarkdownShortcut(prefix);
          if (kind) {
            event.preventDefault();
            const focus = onMarkdownShortcut(context, block.id, kind, value.slice(selection.start));
            if (focus) context.setPendingFocus(focus);
          }
        } else if (event.key === "Enter") {
          event.preventDefault();
          if (!event.shiftKey) skipBlurRef.current = true;
          const focus = event.shiftKey
            ? onSoftBreak(block.id, value, selection.start, selection.end)
            : onEnter(context, block.id, value, selection.start, selection.end);
          if (focus) context.setPendingFocus(focus);
        } else if (event.key === "Backspace" && selection.start === 0 && selection.end === 0) {
          const focus = onBackspace(context, block.id);
          if (focus) {
            event.preventDefault();
            skipBlurRef.current = true;
            context.setPendingFocus(focus);
          }
        }
      }}
      onMouseUp={(event) => {
        const value = readLiveText(event.currentTarget);
        const rawSelection = getSelectionOffsets(event.currentTarget);
        const selection = {
          start: Math.min(rawSelection.start, value.length),
          end: Math.min(rawSelection.end, value.length),
        };
        if (selection.start !== selection.end) {
          onTextSelection({
            blockId: block.id,
            ...selection,
            rect: window.getSelection().getRangeAt(0).getBoundingClientRect(),
          });
        }
      }}
      onPaste={(event) => {
        event.preventDefault();
        skipBlurRef.current = true;
        const value = readLiveText(event.currentTarget);
        const rawSelection = getSelectionOffsets(event.currentTarget);
        const selection = {
          start: Math.min(rawSelection.start, value.length),
          end: Math.min(rawSelection.end, value.length),
        };
        const focus = onPaste(context, block.id, event.clipboardData.getData("text/plain"), value, selection.start, selection.end);
        if (focus) context.setPendingFocus(focus);
      }}
      role="textbox"
      spellCheck
      suppressContentEditableWarning
    >
      {withCaretAnchor(text)}
    </span>
  );
}

function Media({ block, document, gridProps, onActivate, onCaptionChange, onContextMenu, onSelect }) {
  const asset = getProjectAsset(document, block.assetId);
  const src = resolveProjectAssetUrl(document, asset.src);
  const hasCaption = block.caption != null;
  // The .img-wrap wrapper (not the media element) carries grid positioning,
  // interactivity, and the legacy vertical-rhythm rules it shares with the
  // static-HTML projects (see ProjectRenderer.scss) - standalone images and
  // videos need it exactly like the old group-wrapped ones did.
  const className = getMediaClassName(block.variant, block.layout);
  const activate = (event) => (onActivate ? onActivate(event) : onSelect(block.id));
  const media =
    block.type === "image" ? (
      <img alt={block.alt} className={className} data-block-type="image" data-layout={block.layout} onClick={activate} src={src} />
    ) : (
      <video
        autoPlay={block.playback.autoplay}
        className={className}
        controls={block.playback.controls}
        data-block-type="video"
        data-layout={block.layout}
        loop={block.playback.loop}
        muted={block.playback.muted}
        onClick={activate}
        playsInline
        poster={block.posterAssetId ? resolveProjectAssetUrl(document, getProjectAsset(document, block.posterAssetId).src) : undefined}
        src={src}
      />
    );

  const captioned = hasCaption ? (
    <figure className="project-media-captioned" data-block-type={block.type} data-layout={block.layout}>
      {media}
      <figcaption
        contentEditable
        data-caption-block-id={block.id}
        data-placeholder="캡션을 입력하세요"
        onBlur={(event) => {
          const text = event.currentTarget.textContent ?? "";
          onCaptionChange(block.id, text.trim() === "" ? null : text);
        }}
        onClick={(event) => event.stopPropagation()}
        suppressContentEditableWarning
      >
        {block.caption}
      </figcaption>
    </figure>
  ) : (
    media
  );

  const content = block.frame ? (
    <FrameBox
      backgroundSrc={block.frameBackgroundAssetId ? resolveProjectAssetUrl(document, getProjectAsset(document, block.frameBackgroundAssetId).src) : undefined}
      padding={{
        top: block.framePaddingTop,
        bottom: block.framePaddingBottom,
        left: block.framePaddingLeft,
        right: block.framePaddingRight,
      }}
    >
      {captioned}
    </FrameBox>
  ) : (
    captioned
  );

  return (
    <div
      className={["img-wrap", gridProps.className].filter(Boolean).join(" ")}
      data-block-type={block.type}
      data-editor-block-id={block.id}
      onContextMenu={(event) => {
        event.stopPropagation();
        onContextMenu?.(event);
      }}
      style={gridProps.style}
    >
      {content}
    </div>
  );
}

function EditableBlock({
  block,
  document,
  onActivate,
  onCaptionChange,
  onCodeChange,
  onDragOverBlock,
  onDropBlock,
  onOpenMenu,
  onSelect,
  onTextAction,
  onTextChange,
  onToggleSelect,
  ownerContext,
  selected,
}) {
  const children = block.children?.map((child) => (
    <EditableBlock
      block={child}
      document={document}
      key={child.id}
      onCaptionChange={onCaptionChange}
      onCodeChange={onCodeChange}
      onSelect={onSelect}
      onTextAction={onTextAction}
      onTextChange={onTextChange}
      ownerContext={ownerContext}
    />
  ));
  const gridProps = getGridProps(block, document.contentWidth);
  const className = [block.type === "group" && "group", getVariantClassName(block.variant), gridProps.className].filter(Boolean).join(" ");
  const activate = (event) => {
    event.stopPropagation();
    if ((event.metaKey || event.ctrlKey) && onToggleSelect) {
      onToggleSelect(block.id);
      return;
    }
    if (onActivate) onActivate(event);
    else onSelect(block.id);
  };
  const openMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onOpenMenu?.(event);
  };
  const interactionProps = onActivate
    ? {
        "data-editor-block": true,
        "data-editor-block-id": block.id,
        "data-selected": selected || undefined,
        onClick: activate,
        onDragOver: (event) => {
          event.preventDefault();
          onDragOverBlock?.(event);
        },
        onDrop: (event) => {
          event.preventDefault();
          onDropBlock?.(event);
        },
        ...(isMediaBlock(block) && onOpenMenu ? { onContextMenu: openMenu } : {}),
      }
    : {};

  if (block.type === "text") {
    return <EditableText block={block} context={ownerContext} onTextChange={onTextChange} {...onTextAction} />;
  }
  if (block.type === "lineBreak") return <br />;
  if (block.type === "image" || block.type === "video") {
    return (
      <Media
        block={block}
        document={document}
        gridProps={gridProps}
        onActivate={onActivate ? activate : null}
        onCaptionChange={onCaptionChange}
        onContextMenu={onOpenMenu ? openMenu : undefined}
        onSelect={onSelect}
      />
    );
  }
  if (block.type === "codeBlock") {
    return (
      <div className={[className, styles.codeBlock].filter(Boolean).join(" ")} data-block-type="codeBlock" style={gridProps.style} {...interactionProps}>
        <div className={styles.codeBlockLabel}>{getCodeLanguageLabel(block.language)}</div>
        <pre>
          <code
            contentEditable
            data-placeholder="코드를 입력하세요"
            onBlur={async (event) => {
              const raw = event.currentTarget.textContent ?? "";
              const formatted = await formatCode(raw, block.language);
              onCodeChange(block.id, { code: formatted });
            }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              event.preventDefault();
              insertTextAtCaret("\t");
            }}
            onPaste={(event) => {
              event.preventDefault();
              insertTextAtCaret(event.clipboardData.getData("text/plain"));
            }}
            suppressContentEditableWarning
          >
            {block.code}
          </code>
        </pre>
      </div>
    );
  }
  if (block.type === "heading") {
    return createElement(`h${block.level}`, { className, "data-block-type": "heading", style: gridProps.style, ...interactionProps }, children);
  }
  if (block.type === "paragraph") {
    return (
      <p className={className} data-block-type="paragraph" style={gridProps.style} {...interactionProps}>
        {children}
      </p>
    );
  }
  if (block.type === "quote") {
    return (
      <blockquote className={className} data-block-type="quote" style={gridProps.style} {...interactionProps}>
        {children}
      </blockquote>
    );
  }
  if (block.type === "link") {
    return (
      <a
        className={className}
        data-block-type="link"
        href={block.href}
        style={gridProps.style}
        onClick={(event) => {
          event.preventDefault();
          activate(event);
        }}
      >
        {children}
      </a>
    );
  }
  if (block.type === "divider") {
    return <hr className={`project-divider ${gridProps.className ?? ""}`} data-block-type="divider" style={gridProps.style} {...interactionProps} />;
  }
  if (block.type === "spacer") {
    return (
      <div
        className={`project-spacer ${gridProps.className ?? ""}`}
        data-block-type="spacer"
        data-size={block.size}
        style={gridProps.style}
        {...interactionProps}
      />
    );
  }

  const tags = {
    section: "section",
    group: "div",
    list: block.ordered ? "ol" : "ul",
    listItem: "li",
    callout: "aside",
    span: "span",
  };
  const Tag = tags[block.type];
  return Tag ? (
    <Tag className={className} data-block-type={block.type} style={gridProps.style} {...interactionProps}>
      {children}
    </Tag>
  ) : null;
}

function EditableBlockList({
  blocks,
  document,
  metaTargetId,
  onActivate,
  onCaptionChange,
  onCodeChange,
  onDragOverBlock,
  onDropBlock,
  onOpenMenu,
  onSelect,
  onTextAction,
  onTextChange,
  onToggleSelect,
  parentId = null,
  selectedBlockIds,
}) {
  return blocks.map((block, index) => {
    if (isRecursiveContainer(block)) {
      const Tag = block.type === "section" ? "section" : "div";
      return (
        <Tag
          className={getVariantClassName(block.variant)}
          data-content-grid={block.variant?.some((variant) => ["intro", "contentSection"].includes(variant)) || undefined}
          data-layout-container
          key={block.id}
        >
          {block.id === metaTargetId && <ProjectMeta contentWidth={document.contentWidth} items={document.meta} />}
          <EditableBlockList
            blocks={block.children ?? []}
            document={document}
            metaTargetId={metaTargetId}
            onSelect={onSelect}
            onTextChange={onTextChange}
            onTextAction={onTextAction}
            onActivate={onActivate}
            onCaptionChange={onCaptionChange}
            onCodeChange={onCodeChange}
            onDragOverBlock={onDragOverBlock}
            onDropBlock={onDropBlock}
            onOpenMenu={onOpenMenu}
            onToggleSelect={onToggleSelect}
            parentId={block.id}
            selectedBlockIds={selectedBlockIds}
          />
        </Tag>
      );
    }

    if (isBlankTextBlock(block)) return null;

    return (
      <EditableBlock
        block={block}
        document={document}
        key={block.id}
        onActivate={(event) => onActivate(block, parentId, index, event.currentTarget)}
        onCaptionChange={onCaptionChange}
        onCodeChange={onCodeChange}
        onDragOverBlock={(event) => onDragOverBlock(block, parentId, index, event)}
        onDropBlock={(event) => onDropBlock(block, parentId, index, event)}
        onOpenMenu={onOpenMenu ? (event) => onOpenMenu(block, parentId, index, event) : undefined}
        onSelect={onSelect}
        onTextAction={onTextAction}
        onTextChange={onTextChange}
        onToggleSelect={onToggleSelect}
        ownerContext={{
          ...onTextAction,
          current: { block, parentId, index },
        }}
        selected={selectedBlockIds?.has(block.id)}
      />
    );
  });
}

export default function WysiwygProjectCanvas({
  document,
  onBackspace,
  onCaptionChange,
  onChangeType,
  onCodeChange,
  onDelete,
  onDocumentChange,
  onDuplicate,
  onEnter,
  onFrameChange,
  onGroupBlocks,
  onInlineFormat,
  onInsert,
  onMarkdownShortcut,
  onMove,
  onPaste,
  onPickFrameBackground,
  onReplaceMedia,
  onResize,
  onSelect = () => {},
  onSoftBreak,
  onTextChange,
  onUngroup,
}) {
  const [activeBlock, setActiveBlock] = useState(null);
  const [dragSelect, setDragSelect] = useState(null);
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [inlineSelection, setInlineSelection] = useState(null);
  const [inlineTypeMenuOpen, setInlineTypeMenuOpen] = useState(false);
  const [mediaMenu, setMediaMenu] = useState(null);
  const [pendingCaptionFocus, setPendingCaptionFocus] = useState(null);
  const [pendingFocus, setPendingFocus] = useState(null);
  const [popover, setPopover] = useState(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [settingsDetailOpen, setSettingsDetailOpen] = useState(false);
  const [selectedBlockIds, setSelectedBlockIds] = useState(() => new Set());
  const cover = getProjectAsset(document, document.hero.coverAssetId);
  const liveActiveBlock = activeBlock ? findBlock(document.blocks, activeBlock.block.id) : null;
  const liveMenuBlock = mediaMenu ? findBlock(document.blocks, mediaMenu.blockId) : null;
  const canGroupSelection =
    selectedBlockIds.size >= 2 &&
    (() => {
      const parents = [...selectedBlockIds].map((id) => findParentBlock(document.blocks, id)?.id ?? null);
      return parents.every((parentIdValue) => parentIdValue === parents[0]);
    })();
  useEffect(() => {
    if (popover !== "settings") setSettingsDetailOpen(false);
  }, [popover]);
  useEffect(() => {
    const closeToolbar = () => {
      setActiveBlock(null);
      setPopover(null);
      setDropIndicator(null);
    };
    window.addEventListener("scroll", closeToolbar, { passive: true });
    return () => window.removeEventListener("scroll", closeToolbar);
  }, []);
  useEffect(() => {
    if (!inlineSelection) return undefined;
    const handleSelectionChange = () => {
      if (window.getSelection()?.isCollapsed) {
        setInlineSelection(null);
        setInlineTypeMenuOpen(false);
      }
    };
    window.document.addEventListener("selectionchange", handleSelectionChange);
    return () => window.document.removeEventListener("selectionchange", handleSelectionChange);
  }, [inlineSelection]);
  useEffect(() => {
    if (!pendingFocus) return;
    const frame = window.requestAnimationFrame(() => {
      const element = window.document.querySelector(`[data-text-block-id="${CSS.escape(pendingFocus.blockId)}"]`);
      if (element) setCaret(element, pendingFocus.offset ?? 0);
      setPendingFocus(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [document, pendingFocus]);
  useEffect(() => {
    if (!pendingCaptionFocus) return;
    const frame = window.requestAnimationFrame(() => {
      const element = window.document.querySelector(`[data-caption-block-id="${CSS.escape(pendingCaptionFocus)}"]`);
      if (element) setCaret(element, element.textContent?.length ?? 0);
      setPendingCaptionFocus(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [document, pendingCaptionFocus]);
  useEffect(() => {
    if (!mediaMenu) return;
    const closeMenu = (event) => {
      if (!event.target.closest?.("[data-media-menu]")) setMediaMenu(null);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMediaMenu(null);
    };
    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mediaMenu]);
  useEffect(() => {
    if (selectedBlockIds.size === 0) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedBlockIds(new Set());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBlockIds]);
  const updateHeroText = (field, event) => {
    const text = event.currentTarget.textContent;
    onDocumentChange(
      (current) => ({
        ...current,
        hero: { ...current.hero, [field]: text },
      }),
      `hero:${field}`,
    );
  };
  const activateBlock = (block, parentId, index, element) => {
    const rect = element.getBoundingClientRect();
    setActiveBlock({
      block,
      parentId,
      index,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setPopover(null);
    setReplaceMode(false);
    onSelect(block.id);
  };
  const insertAfter = (kind) => {
    if (!activeBlock) return;
    if (replaceMode) onChangeType(activeBlock.block, kind);
    else onInsert(kind, activeBlock.parentId, activeBlock.index + 1);
    setPopover(null);
    setReplaceMode(false);
  };
  const deleteActiveBlock = () => {
    if (!activeBlock) return;
    onDelete(activeBlock.block.id);
    setActiveBlock(null);
    setPopover(null);
  };
  const handleUngroup = () => {
    if (!activeBlock || !isUngroupableGroup(liveActiveBlock)) return;
    onUngroup(activeBlock.block.id);
    setActiveBlock(null);
    setPopover(null);
  };
  const toggleSelect = (blockId) => {
    setActiveBlock(null);
    setPopover(null);
    setSelectedBlockIds((current) => {
      const next = new Set(current);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };
  const clearSelection = () => setSelectedBlockIds(new Set());
  const handleGroupSelected = () => {
    if (!canGroupSelection) return;
    onGroupBlocks([...selectedBlockIds]);
    clearSelection();
  };
  const handleCanvasMouseDown = (event) => {
    if (event.button !== 0) return;
    if (event.target.closest("[data-editor-block], [contenteditable], button, a, input, select, textarea, [data-media-menu]")) {
      return;
    }
    // Attach the tracking listeners synchronously, right here, instead of
    // from an effect keyed on dragSelect state - waiting for that state to
    // commit and the effect to run loses the race against pointermove/up
    // events that follow immediately (the resize handles below use this same
    // "attach inside the handler" pattern for the same reason).
    const start = { x: event.clientX, y: event.clientY };
    setDragSelect({ startX: start.x, startY: start.y, x: start.x, y: start.y });

    const handleMove = (moveEvent) => {
      setDragSelect((current) => (current ? { ...current, x: moveEvent.clientX, y: moveEvent.clientY } : current));
    };
    const handleUp = (upEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      const moved = Math.abs(upEvent.clientX - start.x) > 4 || Math.abs(upEvent.clientY - start.y) > 4;
      if (moved) {
        const left = Math.min(start.x, upEvent.clientX);
        const right = Math.max(start.x, upEvent.clientX);
        const top = Math.min(start.y, upEvent.clientY);
        const bottom = Math.max(start.y, upEvent.clientY);
        const matches = new Set();
        window.document.querySelectorAll("[data-editor-block]").forEach((element) => {
          const rect = element.getBoundingClientRect();
          const intersects = rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top;
          if (intersects) {
            const id = element.getAttribute("data-editor-block-id");
            if (id) matches.add(id);
          }
        });
        setSelectedBlockIds(matches);
        setActiveBlock(null);
        setPopover(null);
      }
      setDragSelect(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  };
  const openMediaMenu = (block, parentId, index, event) => {
    activateBlock(block, parentId, index, event.currentTarget);
    setMediaMenu({ blockId: block.id, top: event.clientY, left: event.clientX });
  };
  const closeMediaMenu = () => setMediaMenu(null);
  // Media nested more than one level deep (e.g. an image group inside a list
  // item) never gets its own bound onOpenMenu - EditableBlock's own child
  // recursion only threads onSelect/onTextAction/onTextChange down, not
  // onActivate/onOpenMenu, so there's nothing for the per-element handler to
  // call and the contextmenu event just keeps bubbling. This root-level
  // fallback catches it once it reaches here, using the DOM instead of props
  // to find which media block was actually right-clicked.
  const handleCanvasContextMenu = (event) => {
    const mediaEl = event.target.closest("img, video, figure.project-media-captioned");
    if (!mediaEl) return;
    const idHolder = mediaEl.closest("[data-editor-block-id]");
    const blockId = idHolder?.getAttribute("data-editor-block-id");
    const block = blockId ? findBlock(document.blocks, blockId) : null;
    if (!block) return;
    event.preventDefault();
    activateBlock(block, null, 0, idHolder);
    setMediaMenu({ blockId: block.id, top: event.clientY, left: event.clientX });
  };
  const handleReplaceMedia = () => {
    if (!liveMenuBlock) return;
    onReplaceMedia(liveMenuBlock.id, liveMenuBlock.grid);
    closeMediaMenu();
  };
  const handleDuplicateMedia = () => {
    if (!liveMenuBlock) return;
    onDuplicate(liveMenuBlock.id);
    closeMediaMenu();
  };
  const handleDeleteMedia = () => {
    if (!liveMenuBlock) return;
    onDelete(liveMenuBlock.id);
    setActiveBlock(null);
    closeMediaMenu();
  };
  const handleToggleFrame = () => {
    if (!liveMenuBlock) return;
    onFrameChange(liveMenuBlock.id, { frame: !liveMenuBlock.frame });
  };
  const handleToggleFramePadding = (side) => {
    if (!liveMenuBlock) return;
    const field = `framePadding${side}`;
    onFrameChange(liveMenuBlock.id, { [field]: !liveMenuBlock[field] });
  };
  const handlePickFrameBackground = () => {
    if (!liveMenuBlock) return;
    onPickFrameBackground(liveMenuBlock.id);
    closeMediaMenu();
  };
  const handleToggleCaption = () => {
    if (!liveMenuBlock || (liveMenuBlock.type !== "image" && liveMenuBlock.type !== "video")) return;
    if (liveMenuBlock.caption == null) onCaptionChange(liveMenuBlock.id, "");
    setPendingCaptionFocus(liveMenuBlock.id);
    closeMediaMenu();
  };
  const openSlashMenu = (context, element) => {
    const rect = element.closest("[data-editor-block]")?.getBoundingClientRect() ?? element.getBoundingClientRect();
    setActiveBlock({ ...context.current, top: rect.top, left: rect.left });
    setReplaceMode(true);
    setPopover("insert");
  };
  const startResize = (side, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!liveActiveBlock || !isResizableBlock(liveActiveBlock)) return;

    const element = window.document.querySelector(`[data-editor-block-id="${CSS.escape(liveActiveBlock.id)}"]`);
    const grid = element?.closest("[data-content-grid]");
    if (!element || !grid) return;

    const startRect = element.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const startX = event.clientX;
    const startSpan = Math.min(14, Math.max(2, liveActiveBlock.grid?.span ?? 14));
    const columnWidth = gridRect.width / 14;
    const parity = startSpan % 2;

    const handleMove = (moveEvent) => {
      const outwardDelta = side === "right" ? moveEvent.clientX - startX : startX - moveEvent.clientX;
      const steps = Math.round(outwardDelta / columnWidth);
      let span = startSpan + steps * 2;
      span = Math.min(14, Math.max(parity ? 1 : 2, span));
      if (span % 2 !== parity) span -= 1;

      onResize(liveActiveBlock.id, span);
      const width = Math.min(gridRect.width, Math.max(columnWidth, (gridRect.width * span) / 14));
      setActiveBlock((current) =>
        current
          ? {
              ...current,
              top: startRect.top,
              left: gridRect.left + (gridRect.width - width) / 2,
              width,
              height: startRect.height,
            }
          : current,
      );
    };
    const stopResize = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopResize);
      window.document.body.style.removeProperty("cursor");
      window.document.body.style.removeProperty("user-select");
    };

    window.document.body.style.cursor = "ew-resize";
    window.document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopResize, { once: true });
  };
  const textActions = {
    onBackspace,
    onEnter,
    onMarkdownShortcut,
    onPaste,
    onSlash: openSlashMenu,
    onSoftBreak,
    onTextSelection: setInlineSelection,
    setPendingFocus,
  };
  const getDropTarget = (block, parentId, index, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY >= rect.top + rect.height / 2;
    return {
      blockId: block.id,
      parentId,
      index: after ? index + 1 : index,
      top: after ? rect.bottom : rect.top,
      left: rect.left,
      width: rect.width,
    };
  };

  return (
    <div
      className={styles.canvas}
      onContextMenu={handleCanvasContextMenu}
      onMouseDown={handleCanvasMouseDown}
      style={{
        "--theme-accent": document.theme.accentColor || document.theme.mainForegroundColor,
        "--theme-background": document.theme.mainBackgroundColor,
        "--theme-foreground": document.theme.mainForegroundColor,
        "--theme-accent-active": document.theme.accentActiveColor,
        "--group-background": document.theme.subBackgroundColor,
        "--group-foreground": document.theme.subForegroundColor,
      }}
    >
      {document.pageMeta.styles && <style>{document.pageMeta.styles}</style>}
      <div className={styles.canvasLabel}>페이지에서 직접 편집</div>
      <div className="contents" id="contents">
        <div id="slider">
          <div className="title-sec">
            <div className="title">
              <div className="title-head">
                <span className="category-eyebrow" contentEditable onBlur={(event) => updateHeroText("eyebrow", event)} suppressContentEditableWarning>
                  {document.hero.eyebrow}
                </span>
                <h1
                  className="title-content-headline"
                  contentEditable
                  onBlur={(event) => {
                    const text = event.currentTarget.textContent;
                    onDocumentChange((current) => ({ ...current, title: text }), "project:title");
                  }}
                  suppressContentEditableWarning
                >
                  {document.title}
                </h1>
              </div>
            </div>
            <div className="hero-cover">
              <img alt="" className="hero-cover-image" src={resolveProjectAssetUrl(document, cover.src)} />
            </div>
          </div>
        </div>
        <EditableBlockList
          blocks={document.blocks}
          document={document}
          metaTargetId={findFirstContentSectionId(document.blocks)}
          onActivate={activateBlock}
          onCaptionChange={onCaptionChange}
          onCodeChange={onCodeChange}
          onDragOverBlock={(block, parentId, index, event) => {
            if (block.id === draggedBlockId) {
              setDropIndicator(null);
              return;
            }
            setDropIndicator(getDropTarget(block, parentId, index, event));
          }}
          onDropBlock={(block, parentId, index, event) => {
            const blockId = event.dataTransfer.getData("application/x-portfolio-block");
            if (blockId && blockId !== block.id) {
              const target = getDropTarget(block, parentId, index, event);
              onMove(blockId, target.parentId, target.index);
            }
            setDraggedBlockId(null);
            setDropIndicator(null);
          }}
          onOpenMenu={openMediaMenu}
          onSelect={onSelect}
          onTextAction={textActions}
          onTextChange={onTextChange}
          onToggleSelect={toggleSelect}
          selectedBlockIds={selectedBlockIds}
        />
        <RelatedProjects document={document} />
      </div>
      <Footer />
      {inlineSelection &&
        (() => {
          const selectionBlock = findBlock(document.blocks, inlineSelection.blockId);
          const selectionMarks = selectionBlock?.marks ?? [];
          const isLinked = findParentBlock(document.blocks, inlineSelection.blockId)?.type === "link";
          const typeTarget = findConvertibleAncestor(document.blocks, inlineSelection.blockId);
          const currentTypeValue = typeTarget ? getBlockTypeValue(typeTarget) : null;
          const currentTypeLabel = blockTypeOptions.find((option) => option.value === currentTypeValue)?.label ?? "텍스트";
          const markButtons = [
            { format: "bold", label: "B", className: styles.inlineBold },
            { format: "italic", label: "I", className: styles.inlineItalic },
            { format: "strike", label: "S", className: styles.inlineStrike },
            { format: "code", label: "</>", className: styles.inlineCode },
            { format: "highlight", label: "Highlight" },
          ];
          return (
            <div
              className={styles.inlineToolbar}
              style={{
                top: Math.max(8, inlineSelection.rect.top - 44),
                left: inlineSelection.rect.left,
              }}
            >
              {typeTarget && (
                <div className={styles.inlineTypeSwitch}>
                  <button
                    aria-expanded={inlineTypeMenuOpen}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setInlineTypeMenuOpen((open) => !open)}
                    type="button"
                  >
                    {currentTypeLabel} ▾
                  </button>
                  {inlineTypeMenuOpen && (
                    <Menu className={styles.inlineTypeMenu} width="220px">
                      <MenuSection>
                        {blockTypeOptions.map((option) => (
                          <MenuItem
                            checked={option.value === currentTypeValue}
                            icon={<Icon name={option.icon} />}
                            key={option.value}
                            label={option.label}
                            onMouseDown={(event) => event.preventDefault()}
                            onSelect={() => {
                              onChangeType(typeTarget, option.value);
                              setInlineTypeMenuOpen(false);
                              setInlineSelection(null);
                            }}
                          />
                        ))}
                      </MenuSection>
                    </Menu>
                  )}
                </div>
              )}
              {markButtons.map(({ format, label, className }) => (
                <button
                  aria-pressed={selectionMarks.includes(format)}
                  className={[className, selectionMarks.includes(format) ? styles.inlineActive : undefined].filter(Boolean).join(" ")}
                  key={format}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onInlineFormat(inlineSelection, format);
                    setInlineSelection(null);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
              <button
                aria-pressed={isLinked}
                className={isLinked ? styles.inlineActive : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (isLinked) {
                    onInlineFormat(inlineSelection, "unlink");
                  } else {
                    const href = window.prompt("링크 주소를 입력하세요", "https://");
                    if (href) onInlineFormat(inlineSelection, "link", href);
                  }
                  setInlineSelection(null);
                }}
                type="button"
              >
                {isLinked ? "Unlink" : "Link"}
              </button>
            </div>
          );
        })()}
      {dropIndicator && (
        <div
          aria-hidden="true"
          className={styles.dropIndicator}
          style={{
            top: dropIndicator.top,
            left: dropIndicator.left,
            width: dropIndicator.width,
          }}
        />
      )}
      {activeBlock && liveActiveBlock && isResizableBlock(liveActiveBlock) && (
        <div
          className={styles.resizeFrame}
          style={{
            top: activeBlock.top,
            left: activeBlock.left,
            width: activeBlock.width,
            height: activeBlock.height,
          }}
        >
          <button
            aria-label="왼쪽에서 블록 너비 조절"
            className={`${styles.resizeHandle} ${styles.resizeHandleLeft}`}
            onPointerDown={(event) => startResize("left", event)}
            type="button"
          />
          <button
            aria-label="오른쪽에서 블록 너비 조절"
            className={`${styles.resizeHandle} ${styles.resizeHandleRight}`}
            onPointerDown={(event) => startResize("right", event)}
            type="button"
          />
        </div>
      )}
      {activeBlock && (
        <div
          className={styles.blockToolbar}
          style={{
            top: Math.max(72, activeBlock.top),
            left: Math.max(8, activeBlock.left - 76),
          }}
        >
          <button
            className={styles.addBlockButton}
            aria-label="블록 추가"
            onClick={() => {
              setReplaceMode(false);
              setPopover(popover === "insert" ? null : "insert");
            }}
            type="button"
          >
            +
          </button>
          <button
            className={styles.dragHandle}
            aria-label="블록 이동 또는 설정"
            draggable
            onClick={() => setPopover(popover === "settings" ? null : "settings")}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("application/x-portfolio-block", activeBlock.block.id);
              setDraggedBlockId(activeBlock.block.id);
              setPopover(null);
            }}
            onDragEnd={() => {
              setDraggedBlockId(null);
              setDropIndicator(null);
            }}
            type="button"
          >
            ⠿
          </button>
          {popover === "insert" && (
            <Menu className={styles.insertMenu} width="240px">
              <MenuSection>
                {blockTypeOptions.map(({ value, label, icon, shortcut }) => (
                  <MenuItem
                    icon={icon && <Icon name={icon} />}
                    key={value}
                    label={label}
                    onSelect={() => insertAfter(value)}
                    shortcut={shortcut || undefined}
                  />
                ))}
              </MenuSection>
            </Menu>
          )}
          {popover === "settings" && (
            <Menu className={styles.settingsMenu} width="240px">
              <MenuSection>
                <MenuItem ariaLabel="블록 삭제" danger icon={<Icon name="delete" />} label="삭제" onSelect={deleteActiveBlock} shortcut="Del" />
                {isUngroupableGroup(liveActiveBlock) && (
                  <MenuItem ariaLabel="그룹 해제" icon={<Icon name="ungroup" />} label="그룹 해제" onSelect={handleUngroup} />
                )}
              </MenuSection>
              <MenuSeparator />
              <MenuSection>
                <MenuItem
                  active={settingsDetailOpen}
                  chevron
                  icon={<Icon name="settings" />}
                  label="블록 설정"
                  onSelect={() => setSettingsDetailOpen((open) => !open)}
                />
              </MenuSection>
            </Menu>
          )}
          {popover === "settings" && settingsDetailOpen && (
            <Menu className={styles.settingsDetailMenu} width="240px">
              <MenuSection>
                {blockTypeOptions.map((option) => (
                  <MenuItem
                    checked={Boolean(liveActiveBlock) && getBlockTypeValue(liveActiveBlock) === option.value}
                    icon={<Icon name={option.icon} />}
                    key={option.value}
                    label={option.label}
                    onSelect={() => {
                      onChangeType(liveActiveBlock, option.value);
                      setPopover(null);
                    }}
                  />
                ))}
              </MenuSection>
            </Menu>
          )}
        </div>
      )}
      {mediaMenu && liveMenuBlock && (
        <Menu className={styles.mediaContextMenu} data-media-menu style={{ top: mediaMenu.top, left: mediaMenu.left }} width="200px">
          <MenuSection>
            <MenuItem icon={<Icon name="replace" />} label="바꾸기" onSelect={handleReplaceMedia} />
            <MenuItem icon={<Icon name="caption" />} label="캡션" onSelect={handleToggleCaption} />
            <MenuItem icon={<Icon name="copy" />} label="복제" onSelect={handleDuplicateMedia} />
            <MenuItem danger icon={<Icon name="delete" />} label="삭제" onSelect={handleDeleteMedia} />
          </MenuSection>
          <MenuSeparator />
          <MenuSection>
            <MenuItem checked={Boolean(liveMenuBlock.frame)} icon={<Icon name="frame" />} label="감싸기" onSelect={handleToggleFrame} />
            {liveMenuBlock.frame && (
              <>
                <MenuItem icon={<Icon name="media" />} label="배경 이미지 선택" onSelect={handlePickFrameBackground} />
                <MenuItem
                  checked={Boolean(liveMenuBlock.framePaddingTop)}
                  icon={<Icon name="frameTop" />}
                  label="위쪽 패딩"
                  onSelect={() => handleToggleFramePadding("Top")}
                />
                <MenuItem
                  checked={Boolean(liveMenuBlock.framePaddingBottom)}
                  icon={<Icon name="frameBottom" />}
                  label="아래쪽 패딩"
                  onSelect={() => handleToggleFramePadding("Bottom")}
                />
                <MenuItem
                  checked={Boolean(liveMenuBlock.framePaddingLeft)}
                  icon={<Icon name="frameLeft" />}
                  label="왼쪽 패딩"
                  onSelect={() => handleToggleFramePadding("Left")}
                />
                <MenuItem
                  checked={Boolean(liveMenuBlock.framePaddingRight)}
                  icon={<Icon name="frameRight" />}
                  label="오른쪽 패딩"
                  onSelect={() => handleToggleFramePadding("Right")}
                />
              </>
            )}
          </MenuSection>
        </Menu>
      )}
      {dragSelect && (
        <div
          className={styles.marquee}
          style={{
            left: Math.min(dragSelect.startX, dragSelect.x),
            top: Math.min(dragSelect.startY, dragSelect.y),
            width: Math.abs(dragSelect.x - dragSelect.startX),
            height: Math.abs(dragSelect.y - dragSelect.startY),
          }}
        />
      )}
      {selectedBlockIds.size > 0 && (
        <div className={styles.selectionBar}>
          <span>{selectedBlockIds.size}개 선택됨</span>
          <button disabled={!canGroupSelection} onClick={handleGroupSelected} type="button">
            그룹으로 묶기
          </button>
          <button onClick={clearSelection} type="button">
            선택 해제
          </button>
        </div>
      )}
    </div>
  );
}
