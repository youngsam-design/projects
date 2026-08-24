import RichContent from "./RichContent";
import { getVariantClassName } from "./blockVariants";

export default function HeadingBlock({ block, gridProps = {} }) {
  const Tag = `h${block.level}`;
  return (
    <Tag
      className={[getVariantClassName(block.variant), gridProps.className]
        .filter(Boolean)
        .join(" ")}
      data-block-type="heading"
      style={gridProps.style}
    >
      <RichContent blocks={block.children} />
    </Tag>
  );
}
