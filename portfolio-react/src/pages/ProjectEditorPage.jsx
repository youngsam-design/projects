import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import BlockEditor from "../components/editor/BlockEditor";
import styles from "../components/editor/ProjectEditor.module.scss";
import ProjectSettingsEditor from "../components/editor/ProjectSettingsEditor";
import WysiwygProjectCanvas from "../components/editor/WysiwygProjectCanvas";
import Header from "../components/layout/Header";
import Button from "../components/ui/Button";
import { isMediaBlock } from "../components/project/blocks/blockVariants";
import ProjectHero from "../components/project/ProjectHero";
import ProjectRenderer from "../components/project/ProjectRenderer";
import {
  createCalloutBlock,
  createBlocksFromPlainText,
  createCodeBlock,
  createColumnsBlock,
  createDividerBlock,
  createHeadingBlock,
  createLinkBlock,
  createMediaBlock,
  createParagraphBlock,
  createQuoteBlock,
  createSpacerBlock,
  createTextBlock,
  createTextListBlock,
  convertBlockType,
  getBlockTypeValue,
} from "../content/editor/projectBlockFactory";
import { materializeEditorAssets, removeDocumentEditorAssets } from "../content/editor/editorAssetStorage";
import {
  detachListItemHeading,
  duplicateBlock,
  getBlock,
  getBlockParent,
  groupBlocks,
  insertBlock,
  mergeBlockWithPrevious,
  moveBlock,
  removeBlock,
  replaceBlockWithBlocks,
  setTextMarks,
  ungroupBlock,
  updateBlock,
} from "../content/editor/projectDocumentOperations";
import { loadProjectV2Content } from "../content/projects-v2";
import { normalizeProjectDocumentWhitespace } from "../content/schema/blockText";
import { uploadProjectAsset } from "../content/repositories/assetRepository";
import { contentApiRequest } from "../content/repositories/contentApiClient";
import {
  getProjectRepositoryMode,
  getProjectPublication,
  listProjectRevisions,
  loadEditableProject,
  loadEditableProjectBySlug,
  resetEditableProject,
  restoreProjectRevision,
  saveEditableProject,
} from "../content/repositories/projectRepository";
import NotFoundPage from "./NotFoundPage";
import useDocumentHistory from "../hooks/useDocumentHistory";

export default function ProjectEditorPage() {
  const { slug } = useParams();
  const [sourceDocument, setSourceDocument] = useState(null);
  const { document, canUndo, canRedo, initialize, replace, change, undo, redo } = useDocumentHistory();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [view, setView] = useState("edit");
  const [previewDocument, setPreviewDocument] = useState(null);
  const [upload, setUpload] = useState(null);
  const [password, setPassword] = useState("");
  const [publication, setPublication] = useState({ status: "loading" });
  const [revisions, setRevisions] = useState([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState("saved");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const mediaInsertTargetRef = useRef(null);
  const dragDepthRef = useRef(0);
  const documentRef = useRef(null);
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    let active = true;
    loadProjectV2Content(slug).then(async (source) => {
      if (!active) return;
      if (!source) {
        try {
          source = await loadEditableProjectBySlug(slug);
        } catch (error) {
          if (!active) return;
          setMessage(error.message);
          setStatus(error.status === 401 ? "unauthorized" : error.status === 404 ? "not-found" : "error");
          return;
        }
        if (!source) {
          setStatus("not-found");
          return;
        }
      }
      setSourceDocument(source);
      loadEditableProject(source)
        .then((editableDocument) => {
          if (!active) return;
          initialize(editableDocument);
          documentRef.current = editableDocument;
          setStatus("ready");
          getProjectPublication(editableDocument.projectId)
            .then(setPublication)
            .catch((error) => setMessage(error.message));
        })
        .catch((error) => {
          if (!active) return;
          setMessage(error.message);
          setStatus(error.status === 401 ? "unauthorized" : "error");
        });
    });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    if (!["dirty", "saving"].includes(saveState)) return;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [saveState]);

  useEffect(() => {
    if (!document) return;
    const previousTitle = window.document.title;
    const previousBodyClass = window.document.body.className;
    const previousBodyStyle = window.document.body.getAttribute("style");
    window.document.title = `편집 · ${document.title}`;
    window.document.body.className = `${document.pageMeta.bodyClass} nonav`;
    if (document.pageMeta.bodyStyle) {
      window.document.body.setAttribute("style", document.pageMeta.bodyStyle);
    } else {
      window.document.body.removeAttribute("style");
    }
    if (document.theme.backgroundColor) {
      window.document.body.style.backgroundColor = `rgb(${document.theme.backgroundColor})`;
    }
    return () => {
      window.document.title = previousTitle;
      window.document.body.className = previousBodyClass;
      if (previousBodyStyle === null) {
        window.document.body.removeAttribute("style");
      } else {
        window.document.body.setAttribute("style", previousBodyStyle);
      }
    };
  }, [document?.pageMeta, document?.title, document?.theme?.backgroundColor]);

  useEffect(() => {
    if (!document) return;
    let active = true;
    let objectUrls = [];
    materializeEditorAssets(document)
      .then((result) => {
        objectUrls = result.urls;
        if (active) setPreviewDocument(result.document);
        else objectUrls.forEach((url) => URL.revokeObjectURL(url));
      })
      .catch(() => {
        if (active) setPreviewDocument(document);
      });
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [document]);

  useEffect(() => {
    if (status !== "ready" || !document || saveState !== "dirty" || busy || upload) return;
    const pendingDocument = document;
    const timer = window.setTimeout(async () => {
      if (saveInFlightRef.current) {
        setSaveState("saving");
        queueMicrotask(() => setSaveState("dirty"));
        return;
      }
      saveInFlightRef.current = true;
      setSaveState("saving");
      try {
        const saved = await saveEditableProject(pendingDocument);
        if (documentRef.current === pendingDocument) {
          replace(saved);
          setSaveState("saved");
        } else {
          replace({ ...documentRef.current, version: saved.version });
          setSaveState("saving");
          queueMicrotask(() => setSaveState("dirty"));
        }
        setMessage(`자동 저장됨 · 문서 버전 ${saved.version}`);
      } catch (error) {
        setSaveState(error.status === 409 ? "conflict" : "error");
        setMessage(error.status === 409 ? "다른 탭에서 문서가 변경되었습니다. 최신 문서를 다시 불러오세요." : `자동 저장 실패: ${error.message}`);
      } finally {
        saveInFlightRef.current = false;
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [busy, document, replace, saveState, status, upload]);

  const hasDraft = useMemo(
    () => Boolean(document && sourceDocument && JSON.stringify(document) !== JSON.stringify(sourceDocument)),
    [document, sourceDocument],
  );

  useEffect(() => {
    if (view !== "edit") return;
    const handleKeyDown = (event) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedo) {
            redo();
            setSaveState("dirty");
          }
        } else if (canUndo) {
          undo();
          setSaveState("dirty");
        }
      } else if (key === "y") {
        event.preventDefault();
        if (canRedo) {
          redo();
          setSaveState("dirty");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canRedo, canUndo, redo, undo, view]);

  if (status === "loading") {
    return <main className="project-loading">편집기를 불러오는 중입니다.</main>;
  }
  if (status === "not-found") return <NotFoundPage />;
  if (status === "unauthorized") {
    const login = async (event) => {
      event.preventDefault();
      try {
        await contentApiRequest("/api/admin/session", {
          method: "POST",
          body: JSON.stringify({ password }),
        });
        window.location.reload();
      } catch (error) {
        setMessage(error.message);
      }
    };
    return (
      <main className={styles.loginPage}>
        <form className={styles.loginCard} onSubmit={login}>
          <span>Portfolio CMS</span>
          <h1>관리자 로그인</h1>
          <p>{message || "편집을 계속하려면 관리자 비밀번호를 입력하세요."}</p>
          <label className={styles.field}>
            비밀번호
            <input autoComplete="current-password" autoFocus onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          <button className={styles.primary} type="submit">
            로그인
          </button>
        </form>
      </main>
    );
  }
  if (status === "error") {
    return (
      <main className="project-loading" role="alert">
        {message || "편집 문서를 불러오지 못했습니다."}
      </main>
    );
  }

  const displayDocument = previewDocument?.assets.length === document.assets.length ? previewDocument : document;

  const apply = (operation) => {
    try {
      change(operation);
      setSaveState("dirty");
      setMessage("변경 사항을 저장할 예정입니다.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateText = (blockId, text) => {
    try {
      change((current) => updateBlock(current, blockId, { text }), `text:${blockId}`);
      setSaveState("dirty");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const findTextBlock = (block, last = false) => {
    if (block?.type === "text") return block;
    const children = last ? [...(block?.children ?? [])].reverse() : (block?.children ?? []);
    for (const child of children) {
      const text = findTextBlock(child, last);
      if (text) return text;
    }
    return null;
  };
  const getSiblingBlocks = (parentId) => (parentId === null ? document.blocks : getBlock(document, parentId)?.children);
  const splitTextBlock = (context, textBlockId, value, start, end) => {
    const { block, parentId, index } = context.current ?? context;

    // A single-line bullet/numbered list item is just a "group" wrapping one
    // paragraph. Splitting it the normal way would add a second paragraph
    // *inside* that same item instead of starting a new, separately
    // numbered/bulleted one - which is what pressing Enter while typing a
    // list actually means.
    // A single-line bullet/numbered list item is a "group" wrapping one
    // paragraph, and it's never given its own nested context - `block` here
    // already *is* that group (its parentId/index describe the group's own
    // position among its siblings). Splitting it the normal way would add a
    // second paragraph *inside* that same item instead of starting a new,
    // separately numbered/bulleted one - which is what pressing Enter while
    // typing a list actually means.
    const isSimpleListItem =
      block.type === "group" && block.children?.length === 1 && (block.variant?.includes("bulletList") || block.variant?.includes("numberedList"));

    // Pressing Enter again on an already-empty list item (the classic
    // "blank line exits the list" gesture) should drop it out of the list
    // as a plain paragraph instead of adding yet another empty bullet.
    if (isSimpleListItem && !value.trim()) {
      const paragraph = createParagraphBlock();
      if (block.grid) paragraph.grid = block.grid;
      const nextText = findTextBlock(paragraph);
      change((current) => replaceBlockWithBlocks(current, block.id, [paragraph]));
      setSaveState("dirty");
      return nextText ? { blockId: nextText.id, offset: 0 } : null;
    }

    if (isSimpleListItem) {
      const nextItem = createTextListBlock(value.slice(end), block.variant.includes("numberedList"));
      const nextText = findTextBlock(nextItem);
      change((current) => {
        const updated = updateBlock(current, textBlockId, {
          text: value.slice(0, start),
        });
        return insertBlock(updated, {
          parentId,
          index: index + 1,
          block: nextItem,
        });
      });
      setSaveState("dirty");
      return nextText ? { blockId: nextText.id, offset: 0 } : null;
    }

    const nextParagraph = createParagraphBlock();
    if (block.grid) nextParagraph.grid = block.grid;
    const nextText = findTextBlock(nextParagraph);
    nextText.text = value.slice(end);
    change((current) => {
      const updated = updateBlock(current, textBlockId, {
        text: value.slice(0, start),
      });
      return insertBlock(updated, {
        parentId,
        index: index + 1,
        block: nextParagraph,
      });
    });
    setSaveState("dirty");
    return { blockId: nextText.id, offset: 0 };
  };
  const replaceTextInBlock = (block, textBlockId, text) => {
    if (block.id === textBlockId) return { ...block, text };
    if (!Array.isArray(block.children)) return block;
    return {
      ...block,
      children: block.children.map((child) => replaceTextInBlock(child, textBlockId, text)),
    };
  };
  const applyMarkdownShortcut = (context, textBlockId, targetType, remainder) => {
    const { block } = context.current ?? context;
    const draft = replaceTextInBlock(block, textBlockId, remainder);
    const convertedBlock = convertBlockType(draft, targetType);
    const nextText = findTextBlock(convertedBlock);
    change((current) => updateBlock(current, block.id, () => convertedBlock));
    setSaveState("dirty");
    return nextText ? { blockId: nextText.id, offset: 0 } : null;
  };
  const insertSoftBreak = (textBlockId, value, start, end) => {
    const nextText = `${value.slice(0, start)}\n${value.slice(end)}`;
    updateText(textBlockId, nextText);
    return { blockId: textBlockId, offset: start + 1 };
  };
  const mergePreviousBlock = (context, textBlockId) => {
    const { block, parentId, index } = context.current ?? context;

    // Backspace at the very start of a list item's own title (its first
    // child, a heading) shouldn't merge into whatever came before and
    // discard the rest of the item - the title labels content that keeps
    // going below it, so detach just the title and keep the rest in place.
    if (block.type === "group" && block.variant?.includes("textList")) {
      const [firstChild] = block.children ?? [];
      const headingText = firstChild?.type === "heading" ? findTextBlock(firstChild) : null;
      if (headingText?.id === textBlockId) {
        change((current) => detachListItemHeading(current, block.id));
        setSaveState("dirty");
        return { blockId: headingText.id, offset: 0 };
      }
    }

    if (index === 0) return null;
    const previous = getSiblingBlocks(parentId)?.[index - 1];
    const previousText = findTextBlock(previous, true);
    if (!previousText) return null;
    const offset = (previousText.text ?? "").length;
    change((current) => mergeBlockWithPrevious(current, block.id));
    setSaveState("dirty");
    return { blockId: previousText.id, offset };
  };
  const pasteBlocks = (context, textBlockId, pastedText, currentText, start, end) => {
    const { block } = context.current ?? context;
    const blocks = createBlocksFromPlainText(pastedText);
    if (!blocks.length) return null;
    const firstText = findTextBlock(blocks[0]);
    const lastText = findTextBlock(blocks.at(-1), true);
    firstText.text = `${currentText.slice(0, start)}${firstText.text ?? ""}`;
    lastText.text = `${lastText.text ?? ""}${currentText.slice(end)}`;
    blocks[0].id = block.id;
    if (block.grid) blocks[0].grid = block.grid;
    change((current) => replaceBlockWithBlocks(current, block.id, blocks));
    setSaveState("dirty");
    return {
      blockId: lastText.id,
      offset: (lastText.text ?? "").length - currentText.slice(end).length,
    };
  };
  const formatInlineSelection = (selection, format, value) => {
    const textBlock = getBlock(document, selection.blockId);
    if (!textBlock || textBlock.type !== "text") return;

    if (format === "unlink") {
      const parent = getBlockParent(document, selection.blockId);
      if (parent?.type !== "link") return;
      const plainChildren = (parent.children ?? []).map((child) => {
        const clone = createTextBlock(child.text ?? "");
        clone.marks = [...(child.marks ?? [])];
        return clone;
      });
      change((current) => replaceBlockWithBlocks(current, parent.id, plainChildren));
      setSaveState("dirty");
      return;
    }

    const text = textBlock.text ?? "";
    const selected = text.slice(selection.start, selection.end);
    if (!selected) return;
    const before = text.slice(0, selection.start);
    const after = text.slice(selection.end);
    const replacements = [];
    if (before) {
      const block = createTextBlock(before);
      block.marks = [...(textBlock.marks ?? [])];
      replacements.push(block);
    }
    if (format === "link") {
      const link = createLinkBlock(selected, value);
      link.children[0].marks = [...(textBlock.marks ?? [])];
      replacements.push(link);
    } else {
      const block = createTextBlock(selected);
      const hasMark = (textBlock.marks ?? []).includes(format);
      block.marks = hasMark ? (textBlock.marks ?? []).filter((mark) => mark !== format) : [...new Set([...(textBlock.marks ?? []), format])];
      replacements.push(block);
    }
    if (after) {
      const block = createTextBlock(after);
      block.marks = [...(textBlock.marks ?? [])];
      replacements.push(block);
    }
    change((current) => replaceBlockWithBlocks(current, selection.blockId, replacements));
    setSaveState("dirty");
  };
  const updateMarks = (blockId, marks) => apply((current) => setTextMarks(current, blockId, marks));
  const updateMediaBlock = (blockId, update, historyField = null) => {
    change((current) => updateBlock(current, blockId, update), historyField ? `media:${blockId}:${historyField}` : null);
    setSaveState("dirty");
  };
  const uploadMedia = async (file) => {
    if (!file) return;
    const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
    if (!kind) {
      setMessage("이미지 또는 영상 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setMessage("파일 크기는 100MB 이하여야 합니다.");
      return;
    }

    // Capture (and immediately release) the insertion target before the async
    // upload runs. Reading the ref only after `await uploadProjectAsset` left
    // it vulnerable to being cleared/overwritten by a second invocation in the
    // meantime, which silently fell back to appending the block at the very
    // end of the document instead of where the user actually inserted it.
    const target = mediaInsertTargetRef.current;
    mediaInsertTargetRef.current = null;

    setUpload({ name: file.name, progress: 10 });
    try {
      const asset = await uploadProjectAsset({
        document,
        file,
        kind,
        onProgress: (progress) => setUpload({ name: file.name, progress }),
      });
      setPreviewDocument(null);
      change((current) => {
        const withAsset = {
          ...current,
          assets: [...current.assets, asset],
        };
        if (target?.mode === "replace") {
          return updateBlock(withAsset, target.blockId, (existing) => ({
            ...createMediaBlock(asset.id, kind),
            id: existing.id,
            ...(target.grid ? { grid: target.grid } : {}),
          }));
        }
        return insertBlock(withAsset, {
          parentId: target?.parentId ?? null,
          index: target?.index ?? withAsset.blocks.length,
          block: createMediaBlock(asset.id, kind),
        });
      });
      setSaveState("dirty");
      setUpload({ name: file.name, progress: 100 });
      setMessage(`${file.name} 파일을 브라우저 저장소에 추가했습니다.`);
      window.setTimeout(() => setUpload(null), 800);
    } catch (error) {
      setUpload({
        name: file.name,
        progress: 0,
        error: error.message,
        file,
      });
      setMessage(`업로드하지 못했습니다: ${error.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const updateProjectSettings = (update, historyKey = null) => {
    change(update, historyKey);
    setSaveState("dirty");
  };

  const replaceMediaBlock = (blockId, grid) => {
    mediaInsertTargetRef.current = { mode: "replace", blockId, grid };
    fileInputRef.current?.click();
  };

  const changeBlockType = (block, targetType) => {
    if (targetType === "media") {
      replaceMediaBlock(block.id, block.grid);
      return;
    }
    apply((current) => updateBlock(current, block.id, (existing) => convertBlockType(existing, targetType)));
  };

  const duplicateBlockHandler = (blockId) => {
    apply((current) => duplicateBlock(current, blockId));
  };

  const groupBlocksHandler = (blockIds) => {
    apply((current) => groupBlocks(current, blockIds));
  };

  const ungroupBlockHandler = (blockId) => {
    apply((current) => ungroupBlock(current, blockId));
  };

  const insertInlineBlock = (kind, parentId, index) => {
    if (kind === "media") {
      mediaInsertTargetRef.current = { parentId, index };
      fileInputRef.current?.click();
      return;
    }
    const factories = {
      paragraph: createParagraphBlock,
      "bullet-list": () => createTextListBlock("", false),
      "numbered-list": () => createTextListBlock("", true),
      quote: createQuoteBlock,
      callout: createCalloutBlock,
      codeBlock: createCodeBlock,
      divider: createDividerBlock,
      spacer: createSpacerBlock,
      "columns-2": () => createColumnsBlock(2),
      "columns-3": () => createColumnsBlock(3),
    };
    let block;
    if (kind.startsWith("heading-")) {
      block = createHeadingBlock();
      block.level = Number(kind.split("-")[1]);
    } else {
      block = factories[kind]?.();
    }
    if (!block) return;
    apply((current) => insertBlock(current, { parentId, index, block }));
  };

  const deleteBlock = (blockId) => {
    apply((current) => removeBlock(current, blockId));
  };

  const save = async () => {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setBusy(true);
    setSaveState("saving");
    try {
      const saved = await saveEditableProject(document);
      replace(saved);
      setSaveState("saved");
      setMessage(`초안을 저장했습니다. 문서 버전 ${saved.version}`);
    } catch (error) {
      setSaveState(error.status === 409 ? "conflict" : "error");
      setMessage(error.message);
    } finally {
      saveInFlightRef.current = false;
      setBusy(false);
    }
  };

  const reset = async () => {
    try {
      await resetEditableProject(document);
      await removeDocumentEditorAssets(document);
      replace(structuredClone(sourceDocument), { clearHistory: true });
      setSaveState("saved");
      setMessage("로컬 초안을 삭제하고 원본으로 되돌렸습니다.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveOrExport = () => (getProjectRepositoryMode() === "api" ? save() : exportProjectFile());

  const exportProjectFile = async () => {
    setBusy(true);
    try {
      const normalized = normalizeProjectDocumentWhitespace(document);
      const response = await fetch("/__editor-api/export-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: document.slug, document: normalized }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || `내보내기 실패 (${response.status})`);
      }
      setMessage(`${result.path} 파일을 갱신했습니다. 커밋 후 배포하세요.`);
    } catch (error) {
      setMessage(`내보내기 실패: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const toggleRevisions = async () => {
    const nextVisible = !showRevisions;
    setShowRevisions(nextVisible);
    if (!nextVisible) return;
    try {
      setRevisions(await listProjectRevisions(document.projectId));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const restoreRevision = async (revisionId) => {
    setBusy(true);
    try {
      const restored = await restoreProjectRevision(document.projectId, revisionId);
      replace(restored, { clearHistory: true });
      setSaveState("saved");
      setRevisions(await listProjectRevisions(document.projectId));
      setMessage(`revision을 문서 버전 ${restored.version}으로 복원했습니다.`);
    } catch (error) {
      setMessage(`복원하지 못했습니다: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleUndo = () => {
    undo();
    setSaveState("dirty");
  };

  const handleRedo = () => {
    redo();
    setSaveState("dirty");
  };

  const handleDragEnter = (event) => {
    if (!event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);
    uploadMedia(event.dataTransfer.files?.[0]);
  };

  return (
    <main
      className={`${styles.page} ${dragActive ? styles.dragActive : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      style={{
        "--theme-accent": document.theme.mainColor,
        "--theme-background": document.theme.backgroundColor,
        "--theme-foreground": document.theme.textColor,
        "--theme-accent-active": document.theme.accentActiveColor,
        "--menu-color": document.theme.menuColor,
      }}
    >
      {dragActive && (
        <div className={styles.dropOverlay} aria-hidden="true">
          이미지 또는 영상을 여기에 놓으세요
        </div>
      )}
      {view === "preview" ? (
        <div
          className={styles.preview}
          style={{
            "--main-color": document.theme.mainColor,
            "--bg-color": document.theme.backgroundColor,
            "--text-color": document.theme.textColor,
            "--menu-color": document.theme.menuColor,
          }}
        >
          <button className={styles.previewBack} onClick={() => setView("edit")} type="button">
            편집으로 돌아가기
          </button>
          <ProjectHero document={displayDocument} />
          <ProjectRenderer document={displayDocument} />
        </div>
      ) : (
        <div className={`${styles.workspace} ${styles.workspaceWide}`}>
          <div className={styles.editorLayout}>
            <div className={styles.canvasColumn}>
              <Header isProject />
              <WysiwygProjectCanvas
                document={displayDocument}
                onBackspace={mergePreviousBlock}
                onCaptionChange={(blockId, caption) => updateMediaBlock(blockId, { caption }, `caption:${blockId}`)}
                onChangeType={changeBlockType}
                onCodeChange={(blockId, update) => updateMediaBlock(blockId, update, `code:${blockId}`)}
                onDelete={deleteBlock}
                onDocumentChange={updateProjectSettings}
                onDuplicate={duplicateBlockHandler}
                onEnter={splitTextBlock}
                onGroupBlocks={groupBlocksHandler}
                onInlineFormat={formatInlineSelection}
                onInsert={insertInlineBlock}
                onMarkdownShortcut={applyMarkdownShortcut}
                onMove={(blockId, parentId, index) => apply((current) => moveBlock(current, blockId, { parentId, index }))}
                onPaste={pasteBlocks}
                onReplaceMedia={replaceMediaBlock}
                onUngroup={ungroupBlockHandler}
                onResize={(blockId, span) => updateMediaBlock(blockId, { grid: { span } }, `grid:${blockId}`)}
                onSoftBreak={insertSoftBreak}
                onTextChange={updateText}
                renderBlockSettings={(block) => {
                  // "넓게"/"전체" only means anything for media laid out
                  // directly in the page's own 14-column grid. Once it's
                  // nested inside another group (a list item, a sub-content
                  // block, etc.), that group's own bounds clip it either way,
                  // so the control has nothing to do.
                  const parent = getBlockParent(displayDocument, block.id);
                  const hideMediaLayoutControl = parent?.type === "group" && !parent.variant?.includes("contentSection");
                  return (
                    <>
                      <label className={styles.field}>
                        블록 유형
                        <select onChange={(event) => changeBlockType(block, event.target.value)} value={getBlockTypeValue(block)}>
                          <option value="paragraph">텍스트</option>
                          <option value="heading-1">제목 1</option>
                          <option value="heading-2">제목 2</option>
                          <option value="heading-3">제목 3</option>
                          <option value="heading-4">제목 4</option>
                          <option value="heading-5">제목 5</option>
                          <option value="heading-6">제목 6</option>
                          <option value="text-list">목록형 div</option>
                          <option value="bullet-list">글머리 목록 div</option>
                          <option value="numbered-list">번호 목록 div</option>
                          <option value="group">그룹 div</option>
                          <option value="quote">인용문</option>
                          <option value="callout">콜아웃</option>
                          <option value="codeBlock">코드 블록</option>
                          <option value="divider">구분선</option>
                          <option value="spacer">간격</option>
                          <option value="media">이미지 또는 영상</option>
                        </select>
                      </label>
                      {isMediaBlock(block) && <p className={styles.gridResizeHint}>블록 좌우의 핸들을 드래그해 너비를 조절하세요.</p>}
                      <BlockEditor
                        block={block}
                        document={displayDocument}
                        hideMediaLayoutControl={hideMediaLayoutControl}
                        onBlockChange={updateMediaBlock}
                        onMarksChange={updateMarks}
                        onTextChange={updateText}
                      />
                    </>
                  );
                }}
              />
            </div>
            <aside className={styles.editorSidebar}>
              <div className={styles.editorSidebarScroll}>
                {getProjectRepositoryMode() === "api" && (
                  <section className={styles.revisionPanel}>
                    <Button onClick={toggleRevisions} size="small" variant="neutral">
                      {showRevisions ? "버전 기록 닫기" : "버전 기록 보기"}
                    </Button>
                    {showRevisions && (
                      <ul>
                        {revisions.length === 0 && <li>저장된 revision이 없습니다.</li>}
                        {revisions.map((revision) => (
                          <li key={revision.id}>
                            <span>
                              v{revision.version} · {revision.reason} · {new Date(revision.createdAt).toLocaleString("ko-KR")}
                            </span>
                            <Button disabled={busy} onClick={() => restoreRevision(revision.id)} size="small" variant="neutral">
                              복원
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                <section className={styles.sidebarSection}>
                  <input
                    accept="image/*,video/*"
                    className={styles.fileInput}
                    onChange={(event) => uploadMedia(event.target.files?.[0])}
                    ref={fileInputRef}
                    type="file"
                  />
                  {upload && (
                    <div className={styles.uploadStatus} aria-live="polite">
                      <span>{upload.name}</span>
                      <progress max="100" value={upload.progress} />
                      {upload.error ? (
                        <Button onClick={() => uploadMedia(upload.file)} size="small" variant="neutral">
                          재시도
                        </Button>
                      ) : (
                        <strong>{upload.progress}%</strong>
                      )}
                    </div>
                  )}
                </section>

                <ProjectSettingsEditor document={document} onChange={updateProjectSettings} />
              </div>

              <div className={styles.editorFooter} role="toolbar" aria-label="편집 도구">
                <div className={styles.headerTitle}>
                  <strong>{document.title}</strong>
                  <span>{message || `문서 버전 ${document.version}`}</span>
                  <span className={styles.saveState} data-state={saveState}>
                    {{
                      saved: "저장됨",
                      dirty: "저장 대기",
                      saving: "저장 중…",
                      conflict: "버전 충돌",
                      error: "저장 실패",
                    }[saveState] ?? saveState}
                  </span>
                  <span className={styles.repositoryMode}>{getProjectRepositoryMode() === "api" ? "API 저장" : "브라우저 저장"}</span>
                  {getProjectRepositoryMode() === "api" && (
                    <span className={styles.publicationStatus}>
                      {publication.status === "published" ? `발행됨 · v${publication.publishedVersion}` : "미발행 초안"}
                    </span>
                  )}
                </div>
                <p className={styles.notice}>
                  {getProjectRepositoryMode() === "api" ? "초안은 검토 후 발행해야 공개 화면에 반영됩니다." : "초안은 현재 브라우저에 자동 저장됩니다."}
                </p>
                <div className={styles.actions}>
                  <Button onClick={() => setView("preview")} size="small" variant="neutral">
                    미리보기
                  </Button>
                  <Button disabled={!hasDraft} onClick={reset} size="small" variant="neutral">
                    초기화(복원)
                  </Button>
                  <Button disabled={busy || saveState === "saving"} onClick={saveOrExport} size="small" variant="primary">
                    저장(내보내기)
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </main>
  );
}
