import RichContent from "./RichContent";
import { getVariantClassName } from "./blockVariants";

export default function ParagraphBlock({ block, gridProps = {} }) {
  return (
    <p
      className={[getVariantClassName(block.variant), gridProps.className]
        .filter(Boolean)
        .join(" ")}
      data-block-type="paragraph"
      style={gridProps.style}
    >
      <RichContent blocks={block.children} />
    </p>
  );
}
