import { createElement } from "react";
import { assertProjectDocument } from "../../content/schema/validateProjectDocument";
import { AssetProvider } from "./blocks/AssetContext";
import CodeBlock from "./blocks/CodeBlock";
import HeadingBlock from "./blocks/HeadingBlock";
import ImageBlock from "./blocks/ImageBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import RichContent from "./blocks/RichContent";
import VideoBlock from "./blocks/VideoBlock";
import { findFirstContentSectionId, getBlockTag, getGridProps, getNumberedListPosition, getVariantClassName } from "./blocks/blockVariants";
import ProjectMeta from "./ProjectMeta";
import { resolveProjectAssetUrl } from "./projectAssets";
import "./ProjectRenderer.scss";

function SemanticBlock({ block, contentWidth, isNested, listNumber, meta, renderBlock, resolveAssetUrl }) {
  const gridProps = getGridProps(block, contentWidth);
  const className = [block.type === "group" && "group", getVariantClassName(block.variant), isNested && "nested", gridProps.className]
    .filter(Boolean)
    .join(" ");

  if (block.type === "heading")
    return <HeadingBlock block={block} gridProps={gridProps} />;
  if (block.type === "paragraph")
    return <ParagraphBlock block={block} gridProps={gridProps} />;
  if (block.type === "image")
    return <ImageBlock block={block} gridProps={gridProps} resolveAssetUrl={resolveAssetUrl} />;
  if (block.type === "video")
    return <VideoBlock block={block} gridProps={gridProps} resolveAssetUrl={resolveAssetUrl} />;
  if (block.type === "codeBlock")
    return <CodeBlock block={block} gridProps={gridProps} />;
  if (block.type === "divider")
    return (
      <hr
        className={`project-divider ${gridProps.className ?? ""}`}
        data-block-type="divider"
        style={gridProps.style}
      />
    );
  if (block.type === "spacer")
    return (
      <div
        aria-hidden="true"
        className={`project-spacer ${gridProps.className ?? ""}`}
        data-block-type="spacer"
        data-size={block.size}
        style={gridProps.style}
      />
    );
  if (block.type === "quote")
    return (
      <blockquote className={className} data-block-type="quote" style={gridProps.style}>
        <RichContent blocks={block.children} />
      </blockquote>
    );
  if (block.type === "embed")
    return (
      <div
        className={`project-embed ${gridProps.className ?? ""}`}
        data-block-type="embed"
        style={{ ...gridProps.style, aspectRatio: block.aspectRatio || undefined }}
      >
        <iframe allowFullScreen loading="lazy" src={block.url} title={block.url} />
      </div>
    );

  const Tag = getBlockTag(block);
  if (!Tag) return null;

  const renderedChildren =
    block.children?.map((child, index) =>
      renderBlock(
        child,
        block.children,
        index,
        block.type === "group" && block.variant?.includes("textList") && child.type === "group" && child.variant?.includes("textList"),
      ),
    ) ?? [];

  return createElement(
    Tag,
    {
      className,
      "data-block-type": block.type,
      "data-list-number": block.variant?.includes("numberedList") ? listNumber : undefined,
      style: gridProps.style,
      ...(block.variant?.some((variant) => ["intro", "contentSection"].includes(variant))
        ? { "data-content-grid": true }
        : {}),
    },
    [
      meta && (
        <ProjectMeta
          contentWidth={meta.contentWidth}
          items={meta.items}
          key="meta"
        />
      ),
      // React requires an explicit <tbody> - unlike raw HTML parsing, it
      // won't insert one implicitly, so <table><tr>...</tr></table> renders
      // with a DOM-nesting warning (and a mismatched tree on updates).
      block.type === "table" ? <tbody key="tbody">{renderedChildren}</tbody> : renderedChildren,
    ],
  );
}

export default function ProjectRenderer({ document, after = null, before = null }) {
  assertProjectDocument(document);

  const resolveAssetUrl = (src) => resolveProjectAssetUrl(document, src);
  const metaTargetId = findFirstContentSectionId(document.blocks);

  const renderBlock = (block, siblings = document.blocks, index = siblings.indexOf(block), isNested = false) => (
    <SemanticBlock
      key={block.id}
      block={block}
      contentWidth={document.contentWidth}
      isNested={isNested}
      listNumber={block.variant?.includes("numberedList") ? getNumberedListPosition(siblings, index) : undefined}
      meta={
        block.id === metaTargetId
          ? { contentWidth: document.contentWidth, items: document.meta }
          : null
      }
      renderBlock={renderBlock}
      resolveAssetUrl={resolveAssetUrl}
    />
  );

  return (
    <AssetProvider assets={document.assets}>
      <div className="contents" id="contents">
        {before}
        {document.blocks.map((block, index) => renderBlock(block, document.blocks, index))}
        {after}
      </div>
    </AssetProvider>
  );
}
