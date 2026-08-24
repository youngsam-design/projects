import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadPublishedProjects } from "../../content/repositories/publicProjectRepository";

export default function PublishedProjectList({ excludeSlugs }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let active = true;
    loadPublishedProjects()
      .then((items) => {
        if (active)
          setProjects(
            items.filter((project) => !excludeSlugs.has(project.slug)),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [excludeSlugs]);

  if (!projects.length) return null;

  return (
    <section
      className="published-projects"
      aria-labelledby="published-projects-title"
    >
      <div className="published-projects-copy">
        <h2 id="published-projects-title">Latest Projects</h2>
      </div>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <Link className="hover-target" to={`/work/${project.slug}/`}>
              <figure>
                {project.coverUrl && <img alt="" src={project.coverUrl} />}
              </figure>
              <div>
                <span>{project.category}</span>
                <h3>{project.title}</h3>
                <p>{project.excerpt}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
