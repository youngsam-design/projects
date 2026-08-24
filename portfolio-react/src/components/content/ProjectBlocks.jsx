import { createElement } from "react";
import { attributesToProps } from "html-react-parser";

const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function normalizeAssetUrl(value, slug) {
  if (!value || /^(?:[a-z]+:|#|\/\/|\/)/i.test(value)) return value;

  const cssUrl = value.match(/^url\(['"]?(.+?)['"]?\)$/i);
  const rawValue = cssUrl?.[1] ?? value;
  const normalized = new URL(
    rawValue,
    `${window.location.origin}${import.meta.env.BASE_URL}work/${slug}/`,
  ).pathname;

  return cssUrl ? `url(${normalized})` : normalized;
}

function getBlockProps(block, slug) {
  const attributes = Object.fromEntries(
    Object.entries(block.attributes ?? {}).map(([name, value]) => [
      name,
      ["src", "poster", "data-url", "href"].includes(name)
        ? normalizeAssetUrl(value, slug)
        : value,
    ]),
  );

  return attributesToProps(attributes);
}

function Block({ block, slug }) {
  if (block.type === "text") return block.value;

  const props = { ...getBlockProps(block, slug), key: block.id };

  if (voidElements.has(block.tag)) {
    return createElement(block.tag, props);
  }

  return createElement(
    block.tag,
    props,
    block.children?.map((child) => (
      <Block key={child.id} block={child} slug={slug} />
    )),
  );
}

export default function ProjectBlocks({ blocks, slug }) {
  return (
    <div className="contents" id="contents">
      {blocks.map((block) => (
        <Block key={block.id} block={block} slug={slug} />
      ))}
    </div>
  );
}
