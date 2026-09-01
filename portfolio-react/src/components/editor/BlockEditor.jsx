import { allowedMarks } from "../../content/schema/blockTypes";
import {
  getBlockText,
  isBlankTextBlock,
} from "../../content/schema/blockText";
import { codeLanguages } from "../../content/schema/codeLanguages";
import { isFormattableLanguage } from "../../content/editor/formatCode";
import { createListItemBlock, createTableCellBlock, createTableRowBlock } from "../../content/editor/projectBlockFactory";
import {
  getProjectAsset,
  resolveProjectAssetUrl,
} from "../project/projectAssets";
import styles from "./ProjectEditor.module.scss";

const visibleChildren = (block) =>
  (block.children ?? []).filter((child) => !isBlankTextBlock(child));

function TextEditor({ block, onTextChange, onMarksChange }) {
  const text = getBlockText(block);

  return (
    <div className={styles.textEditor}>
      <textarea
        aria-label="텍스트 내용"
        className={styles.textarea}
        onChange={(event) => onTextChange(block.id, event.target.value)}
        rows={Math.max(2, Math.ceil(text.trim().length / 55))}
        value={text}
      />
      <div className={styles.markToolbar} aria-label="텍스트 서식">
        {allowedMarks.map((mark) => {
          const active = block.marks.includes(mark);
          return (
            <button
              aria-pressed={active}
              className={active ? styles.markActive : undefined}
              key={mark}
              onClick={() =>
                onMarksChange(
                  block.id,
                  active
                    ? block.marks.filter((item) => item !== mark)
                    : [...block.marks, mark],
                )
              }
              type="button"
            >
              {mark}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MediaEditor({ block, document, hideLayoutControl, onBlockChange }) {
  const asset = getProjectAsset(document, block.assetId);
  const source = resolveProjectAssetUrl(document, asset.src);

  return (
    <div className={styles.mediaEditor}>
      <figure className={styles.mediaBlock}>
        {block.type === "image" ? (
          <img alt={block.alt} src={source} />
        ) : (
          <video muted playsInline src={source} />
        )}
        <figcaption>
          <span>{block.type}</span>
          {asset.name ?? asset.src}
        </figcaption>
      </figure>
      <div className={styles.mediaFields}>
        {block.type === "image" && (
          <label className={styles.field}>
            대체 텍스트
            <input
              onChange={(event) =>
                onBlockChange(block.id, { alt: event.target.value }, "alt")
              }
              placeholder="이미지의 내용을 설명하세요"
              value={block.alt}
            />
          </label>
        )}
        {!hideLayoutControl && (
          <label className={styles.field}>
            너비
            <select
              onChange={(event) =>
                onBlockChange(block.id, { layout: event.target.value })
              }
              value={block.layout}
            >
              <option value="content">콘텐츠</option>
              <option value="wide">넓게</option>
              <option value="full">전체</option>
            </select>
          </label>
        )}
        {block.type === "video" && (
          <fieldset className={styles.playbackFields}>
            <legend>재생 옵션</legend>
            {Object.entries(block.playback).map(([option, enabled]) => (
              <label key={option}>
                <input
                  checked={enabled}
                  onChange={(event) =>
                    onBlockChange(block.id, {
                      playback: {
                        ...block.playback,
                        [option]: event.target.checked,
                        ...(option === "autoplay" && event.target.checked
                          ? { muted: true }
                          : {}),
                      },
                    })
                  }
                  type="checkbox"
                />
                {option}
              </label>
            ))}
          </fieldset>
        )}
      </div>
    </div>
  );
}

function HeadingEditor({ block, editorProps }) {
  return (
    <div className={styles.headingEditor}>
      <label>
        제목 단계
        <select
          onChange={(event) =>
            editorProps.onBlockChange(block.id, {
              level: Number(event.target.value),
            })
          }
          value={block.level}
        >
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <option key={level} value={level}>
              H{level}
            </option>
          ))}
        </select>
      </label>
      {block.children.map((child) => (
        <BlockEditor block={child} key={child.id} {...editorProps} />
      ))}
    </div>
  );
}

function LinkEditor({ block, editorProps }) {
  return (
    <div className={styles.linkEditor}>
      <div className={styles.linkFields}>
        <label className={styles.field}>
          링크 주소
          <input
            inputMode="url"
            onChange={(event) =>
              editorProps.onBlockChange(
                block.id,
                { href: event.target.value },
                "href",
              )
            }
            placeholder="https://example.com"
            type="url"
            value={block.href}
          />
        </label>
        <label className={styles.linkNewTab}>
          <input
            checked={block.newTab}
            onChange={(event) =>
              editorProps.onBlockChange(block.id, {
                newTab: event.target.checked,
              })
            }
            type="checkbox"
          />
          새 탭에서 열기
        </label>
      </div>
      {block.children.map((child) => (
        <BlockEditor block={child} key={child.id} {...editorProps} />
      ))}
    </div>
  );
}

function ListEditor({ block, editorProps }) {
  return (
    <div className={styles.listEditor}>
      <label className={styles.listTypeControl}>
        목록 형식
        <select
          onChange={(event) =>
            editorProps.onBlockChange(block.id, {
              ordered: event.target.value === "ordered",
            })
          }
          value={block.ordered ? "ordered" : "unordered"}
        >
          <option value="unordered">글머리 기호</option>
          <option value="ordered">번호</option>
        </select>
      </label>
      <div className={styles.listItems}>
        {block.children.map((item, index) => (
          <div className={styles.listItemEditor} key={item.id}>
            <span>{index + 1}</span>
            <BlockEditor block={item} {...editorProps} />
            <button
              disabled={block.children.length === 1}
              onClick={() =>
                editorProps.onBlockChange(block.id, (current) => ({
                  ...current,
                  children: current.children.filter(
                    (candidate) => candidate.id !== item.id,
                  ),
                }))
              }
              type="button"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
      <button
        className={styles.addListItem}
        onClick={() =>
          editorProps.onBlockChange(block.id, (current) => ({
            ...current,
            children: [...current.children, createListItemBlock()],
          }))
        }
        type="button"
      >
        + 목록 항목
      </button>
    </div>
  );
}

function TableEditor({ block, editorProps }) {
  const rowCount = block.children.length;
  const columnCount = block.children[0]?.children.length ?? 0;
  const addRow = () =>
    editorProps.onBlockChange(block.id, (current) => ({
      ...current,
      children: [...current.children, createTableRowBlock(columnCount || 1)],
    }));
  const removeRow = () =>
    editorProps.onBlockChange(block.id, (current) => ({
      ...current,
      children: current.children.slice(0, -1),
    }));
  const addColumn = () =>
    editorProps.onBlockChange(block.id, (current) => ({
      ...current,
      children: current.children.map((row) => ({
        ...row,
        children: [...row.children, createTableCellBlock()],
      })),
    }));
  const removeColumn = () =>
    editorProps.onBlockChange(block.id, (current) => ({
      ...current,
      children: current.children.map((row) => ({
        ...row,
        children: row.children.slice(0, -1),
      })),
    }));

  return (
    <div className={styles.tableEditor}>
      <div className={styles.tableEditorActions}>
        <button onClick={addRow} type="button">
          + 행
        </button>
        <button disabled={rowCount <= 1} onClick={removeRow} type="button">
          - 행
        </button>
        <button onClick={addColumn} type="button">
          + 열
        </button>
        <button disabled={columnCount <= 1} onClick={removeColumn} type="button">
          - 열
        </button>
      </div>
      {block.children.map((row, rowIndex) => (
        <div className={styles.tableRowEditor} key={row.id}>
          <span>{rowIndex + 1}행</span>
          {row.children.map((cell) => (
            <BlockEditor block={cell} key={cell.id} {...editorProps} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmbedEditor({ block, onBlockChange }) {
  return (
    <label className={styles.field}>
      임베드 URL
      <input
        inputMode="url"
        onChange={(event) => onBlockChange(block.id, { url: event.target.value })}
        placeholder="https://..."
        type="url"
        value={block.url}
      />
    </label>
  );
}

export default function BlockEditor({
  block,
  depth = 0,
  document,
  hideMediaLayoutControl,
  onBlockChange,
  onMarksChange,
  onTextChange,
}) {
  if (block.type === "text") {
    if (isBlankTextBlock(block)) return null;
    return (
      <TextEditor
        block={block}
        onMarksChange={onMarksChange}
        onTextChange={onTextChange}
      />
    );
  }

  if (block.type === "image" || block.type === "video") {
    return (
      <MediaEditor
        block={block}
        document={document}
        hideLayoutControl={hideMediaLayoutControl}
        onBlockChange={onBlockChange}
      />
    );
  }

  // Once a media block is nested inside any non-content-section group (a
  // list item, sub-content, etc.), "넓게"/"전체" has nothing to break out
  // into - that group's own bounds clip it either way. The flag only ever
  // turns on going down the tree, never off, so it still applies no matter
  // how many plain wrapper levels (heading, link, list item...) sit between
  // that group and the actual media block.
  const childHideMediaLayoutControl =
    hideMediaLayoutControl ||
    (block.type === "group" && !block.variant?.includes("contentSection"));

  if (block.type === "list") {
    return (
      <ListEditor
        block={block}
        editorProps={{
          depth,
          document,
          hideMediaLayoutControl: childHideMediaLayoutControl,
          onBlockChange,
          onMarksChange,
          onTextChange,
        }}
      />
    );
  }
  if (block.type === "divider") {
    return <hr className={styles.editorDivider} />;
  }
  if (block.type === "codeBlock") {
    return (
      <>
        <label className={styles.field}>
          코드 언어
          <select
            onChange={(event) =>
              onBlockChange(block.id, { language: event.target.value })
            }
            value={block.language}
          >
            {codeLanguages.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.settingsHelp}>
          {isFormattableLanguage(block.language)
            ? "코드 영역에서 벗어나면 Prettier로 자동 정렬됩니다."
            : "이 언어는 자동 정렬을 지원하지 않아 입력한 그대로 저장됩니다."}
        </p>
      </>
    );
  }
  if (block.type === "spacer") {
    return (
      <label className={styles.spacerEditor}>
        간격 크기
        <select
          onChange={(event) =>
            onBlockChange(block.id, { size: event.target.value })
          }
          value={block.size}
        >
          <option value="small">작게</option>
          <option value="medium">보통</option>
          <option value="large">크게</option>
        </select>
      </label>
    );
  }

  if (block.type === "heading") {
    return (
      <HeadingEditor
        block={block}
        editorProps={{
          depth,
          document,
          hideMediaLayoutControl: childHideMediaLayoutControl,
          onBlockChange,
          onMarksChange,
          onTextChange,
        }}
      />
    );
  }
  if (block.type === "link") {
    return (
      <LinkEditor
        block={block}
        editorProps={{
          depth,
          document,
          hideMediaLayoutControl: childHideMediaLayoutControl,
          onBlockChange,
          onMarksChange,
          onTextChange,
        }}
      />
    );
  }
  if (block.type === "table") {
    return (
      <TableEditor
        block={block}
        editorProps={{
          depth,
          document,
          hideMediaLayoutControl: childHideMediaLayoutControl,
          onBlockChange,
          onMarksChange,
          onTextChange,
        }}
      />
    );
  }
  if (block.type === "embed") {
    return <EmbedEditor block={block} onBlockChange={onBlockChange} />;
  }

  const children = visibleChildren(block);
  return (
    <div className={styles.nestedBlock} data-block-type={block.type}>
      <div className={styles.blockLabel}>
        {block.type}
        {block.level ? ` · H${block.level}` : ""}
        {block.variant?.length ? ` · ${block.variant.join(", ")}` : ""}
      </div>
      <div className={styles.blockChildren} style={{ "--editor-depth": depth }}>
        {children.map((child) => (
          <BlockEditor
            block={child}
            depth={depth + 1}
            document={document}
            hideMediaLayoutControl={childHideMediaLayoutControl}
            key={child.id}
            onBlockChange={onBlockChange}
            onMarksChange={onMarksChange}
            onTextChange={onTextChange}
          />
        ))}
      </div>
    </div>
  );
}
