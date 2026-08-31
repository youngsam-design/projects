import { Link } from "react-router-dom";
import useProjectCarousel from "../../hooks/useProjectCarousel";
import Icon from "../ui/Icon";
import { getProjectAsset, resolveProjectAssetUrl } from "./projectAssets";
import "./RelatedProjects.scss";

export default function RelatedProjects({ document }) {
  useProjectCarousel(document.slug);

  if (!document.relatedProjects?.length) return null;

  return (
    <div className="project">
      <div className="wrapper">
        <div className="carousel-title">
          <h4>Other Works</h4>
        </div>
        <ul className="carousel" data-target="carousel">
          {document.relatedProjects.map((project) => {
            const thumbnail = getProjectAsset(
              document,
              project.thumbnailAssetId,
            );

            return (
              <li key={project.id} className="card" data-target="card">
                <Link className="hover-target" to={`/work/${project.slug}/`}>
                  <div className="card-in">
                    <figure className="title-media">
                      <div
                        className="img"
                        style={{
                          backgroundImage: `url(${resolveProjectAssetUrl(document, thumbnail.src)})`,
                        }}
                      />
                    </figure>
                    <div className="title-content-text">
                      <div className="title-head">
                        <span className="category-eyebrow">
                          {project.category}
                        </span>
                        <h5 className="title-content-headline">
                          {project.title}
                        </h5>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="button-wrapper">
          <button
            id="prev"
            className="no-drag no"
            type="button"
            aria-label="이전 프로젝트 보기"
          >
            <Icon className="nav-icon" name="arrowLeft" />
          </button>
          <button
            id="next"
            className="no-drag"
            type="button"
            aria-label="다음 프로젝트 보기"
          >
            <Icon className="nav-icon" name="arrowRight" />
          </button>
        </div>
      </div>
    </div>
  );
}
