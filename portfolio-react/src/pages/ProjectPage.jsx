import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LegacyContent from "../components/content/LegacyContent";
import ProjectBlocks from "../components/content/ProjectBlocks";
import ProjectHero from "../components/project/ProjectHero";
import RelatedProjects from "../components/project/RelatedProjects";
import ProjectRenderer from "../components/project/ProjectRenderer";
import SiteLayout from "../components/layout/SiteLayout";
import {
  getDocumentMeta,
  getPageContent,
  loadLegacyProject,
} from "../content/legacyPages";
import { loadProjectContent } from "../content/projects";
import { loadProjectV2Content } from "../content/projects-v2";
import {
  loadPublishedProject,
  usesPublishedProjectApi,
} from "../content/repositories/publicProjectRepository";
import NotFoundPage from "./NotFoundPage";

const initialState = { status: "loading", project: null, error: null };

async function loadProject(slug) {
  const v2Document = await loadProjectV2Content(slug);
  if (usesPublishedProjectApi()) {
    const publishedDocument = await loadPublishedProject(slug);
    if (publishedDocument) return { kind: "v2", document: publishedDocument };
    if (v2Document) return null;
  } else if (v2Document) {
    return { kind: "v2", document: v2Document };
  }

  const [html, content] = await Promise.all([
    loadLegacyProject(slug),
    loadProjectContent(slug),
  ]);

  if (!html || !content) return null;
  return { kind: "legacy", html, content };
}

export default function ProjectPage() {
  const { slug } = useParams();
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let active = true;
    setState(initialState);

    loadProject(slug)
      .then((project) => {
        if (active) {
          setState({
            status: project ? "ready" : "not-found",
            project,
            error: null,
          });
        }
      })
      .catch((error) => {
        if (active) setState({ status: "error", project: null, error });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (state.status !== "ready") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const container = document.getElementById("contents");
    const media = [...(container?.querySelectorAll("img, video") ?? [])];
    if (!media.length) return undefined;

    media.forEach((el) => el.classList.add("reveal-pending"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("reveal-pending");
          observer.unobserve(entry.target);
        });
      },
      // threshold is a fraction of the *element's own* area, not the
      // viewport's - some case-study screenshots here run several thousand
      // px tall, well beyond what a 1000px viewport could ever cover 15% of.
      // threshold: 0 fires as soon as any sliver is visible; rootMargin does
      // the actual pacing instead.
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    media.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [state.status, state.project]);

  if (state.status === "loading") {
    return (
      <main className="project-loading" aria-live="polite" aria-busy="true">
        프로젝트를 불러오는 중입니다.
      </main>
    );
  }

  if (state.status === "not-found") return <NotFoundPage />;

  if (state.status === "error") {
    return (
      <main className="project-loading" role="alert">
        프로젝트를 불러오지 못했습니다.
      </main>
    );
  }

  if (state.project.kind === "v2") {
    const document = state.project.document;
    return (
      <SiteLayout meta={{ ...document.pageMeta, title: `YS - ${document.title}` }} theme={document.theme} isProject>
        <ProjectRenderer
          document={document}
          before={<ProjectHero document={document} />}
          after={<RelatedProjects document={document} />}
        />
      </SiteLayout>
    );
  }

  const { html, content } = state.project;
  const meta = getDocumentMeta(html);
  const shell = getPageContent(html, "project", slug, {
    excludeProjectContent: true,
  });

  return (
    <SiteLayout meta={meta} isProject>
      <LegacyContent html={shell} />
      <ProjectBlocks blocks={content.blocks} slug={slug} />
    </SiteLayout>
  );
}
