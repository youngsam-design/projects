import MeshGradientBox from "./blocks/MeshGradientBox";
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
            <h1 className="title-content-headline">{document.hero.headline}</h1>
          </div>
        </div>
        <div className="hero-cover">
          {document.hero.mesh ? (
            <MeshGradientBox colors={document.theme.meshColors} seedKey="hero-cover" warp={document.hero.meshWarp}>
              {image}
            </MeshGradientBox>
          ) : (
            image
          )}
        </div>
      </div>
    </div>
  );
}
