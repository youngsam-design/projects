import { getTextGridProps } from "./blocks/blockVariants";

export default function ProjectMeta({ contentWidth, items }) {
  if (!items?.length) return null;

  const gridProps = getTextGridProps(contentWidth);

  return (
    <section className="summary" aria-label="프로젝트 정보">
      <ul className={gridProps.className} data-block-type="meta" style={gridProps.style}>
        {items.map((item) => (
          <li key={item.id}>
            <span className="sp-title">{item.label}</span>
            <span className="sp-text">{item.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
