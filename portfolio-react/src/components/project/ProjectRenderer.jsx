import { createElement } from "react";
import { assertProjectDocument } from "../../content/schema/validateProjectDocument";
import { AssetProvider } from "./blocks/AssetContext";
import CodeBlock from "./blocks/CodeBlock";
import HeadingBlock from "./blocks/HeadingBlock";
import ImageBlock from "./blocks/ImageBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import RichContent from "./blocks/RichContent";
import VideoBlock from "./blocks/VideoBlock";
import { findFirstContentSectionId, getGridProps, getVariantClassName } from "./blocks/blockVariants";
import ProjectMeta from "./ProjectMeta";
import { resolveProjectAssetUrl } from "./projectAssets";
import "./ProjectRenderer.scss";

function SemanticBlock({ block, contentWidth, meshColors, meta, renderBlock, resolveAssetUrl }) {
  const gridProps = getGridProps(block, contentWidth);
  const className = [block.type === "group" && "group", getVariantClassName(block.variant), gridProps.className]
    .filter(Boolean)
    .join(" ");

  if (block.type === "heading")
    return <HeadingBlock block={block} gridProps={gridProps} />;
  if (block.type === "paragraph")
    return <ParagraphBlock block={block} gridProps={gridProps} />;
  if (block.type === "image")
    return (
      <ImageBlock
        block={block}
        gridProps={gridProps}
        meshColors={meshColors}
        resolveAssetUrl={resolveAssetUrl}
      />
    );
  if (block.type === "video")
    return (
      <VideoBlock
        block={block}
        gridProps={gridProps}
        meshColors={meshColors}
        resolveAssetUrl={resolveAssetUrl}
      />
    );
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

  const tags = {
    section: "section",
    group: "div",
    list: block.ordered ? "ol" : "ul",
    listItem: "li",
    callout: "aside",
  };
  const Tag = tags[block.type];
  if (!Tag) return null;

  return createElement(
    Tag,
    {
      className,
      "data-block-type": block.type,
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
      ...(block.children?.map((child) => renderBlock(child)) ?? []),
    ],
  );
}

export default function ProjectRenderer({ document, after = null, before = null }) {
  assertProjectDocument(document);

  const resolveAssetUrl = (src) => resolveProjectAssetUrl(document, src);
  const metaTargetId = findFirstContentSectionId(document.blocks);

  const renderBlock = (block) => (
    <SemanticBlock
      key={block.id}
      block={block}
      contentWidth={document.contentWidth}
      meshColors={document.theme.meshColors}
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
        {document.blocks.map(renderBlock)}
        {after}
      </div>
    </AssetProvider>
  );
}
