import { getProjectAsset, resolveProjectAssetUrl } from "./projectAssets";
import "./ProjectHero.scss";

export default function ProjectHero({ document }) {
  const cover = getProjectAsset(document, document.hero.coverAssetId);
  const image = <img alt="" className="hero-cover-image" src={resolveProjectAssetUrl(document, cover.src)} />;

  return (
    <div id="slider">
      <div className="title-sec">
        <div className="title">
          <div className="title-head">
            <span className="category-eyebrow">{document.hero.eyebrow}</span>
            <h1 className="title-content-headline">{document.title}</h1>
          </div>
        </div>
        <div className="hero-cover">{image}</div>
      </div>
    </div>
  );
}
