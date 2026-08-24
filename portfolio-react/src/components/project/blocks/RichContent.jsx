import { Fragment } from "react";
import { getBlockText } from "../../../content/schema/blockText";
import { getVariantClassName } from "./blockVariants";

function applyMarks(text, marks, id) {
  return (marks ?? []).reduce((content, mark) => {
    const elements = {
      bold: (
        <strong key={`${id}-bold`} className="mark-bold">
          {content}
        </strong>
      ),
      semibold: (
        <span key={`${id}-semibold`} className="mark-semibold">
          {content}
        </span>
      ),
      italic: (
        <em key={`${id}-italic`} className="mark-italic">
          {content}
        </em>
      ),
      underline: (
        <u key={`${id}-underline`} className="mark-underline">
          {content}
        </u>
      ),
      strike: (
        <s key={`${id}-strike`} className="mark-strike">
          {content}
        </s>
      ),
      code: (
        <code key={`${id}-code`} className="mark-code">
          {content}
        </code>
      ),
      highlight: (
        <mark key={`${id}-highlight`} className="mark-highlight">
          {content}
        </mark>
      ),
    };
    return elements[mark] ?? content;
  }, text);
}

export default function RichContent({ blocks }) {
  return blocks?.map((block) => {
    if (block.type === "text") {
      return (
        <Fragment key={block.id}>
          {applyMarks(getBlockText(block), block.marks, block.id)}
        </Fragment>
      );
    }

    if (block.type === "lineBreak") return <br key={block.id} />;

    if (block.type === "span") {
      return (
        <span key={block.id} className={getVariantClassName(block.variant)}>
          <RichContent blocks={block.children} />
        </span>
      );
    }

    if (block.type === "link") {
      return (
        <a
          key={block.id}
          className={getVariantClassName(block.variant)}
          href={block.href}
          rel={block.newTab ? "noreferrer" : undefined}
          target={block.newTab ? "_blank" : undefined}
        >
          <RichContent blocks={block.children} />
        </a>
      );
    }

    return null;
  });
}
