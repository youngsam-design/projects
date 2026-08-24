import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProjectDocument } from "../content/schema/projectDocument";
import { contentApiRequest } from "../content/repositories/contentApiClient";
import {
  createEditableProject,
  getProjectRepositoryMode,
  listEditableProjects,
} from "../content/repositories/projectRepository";
import styles from "../components/editor/ProjectDashboard.module.scss";

function normalizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export default function ProjectEditorDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const loadProjects = () =>
    listEditableProjects()
      .then((items) => {
        setProjects(items);
        setStatus("ready");
      })
      .catch((error) => {
        setMessage(error.message);
        setStatus(error.status === 401 ? "unauthorized" : "error");
      });

  useEffect(() => {
    if (getProjectRepositoryMode() !== "api") {
      setStatus("browser");
      return;
    }
    loadProjects();
  }, []);

  const login = async (event) => {
    event.preventDefault();
    try {
      await contentApiRequest("/api/admin/session", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setStatus("loading");
      loadProjects();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createProject = async (event) => {
    event.preventDefault();
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) {
      setMessage("slug는 영문 소문자, 숫자, 하이픈으로 입력하세요.");
      return;
    }
    setStatus("creating");
    try {
      const document = createProjectDocument({
        projectId: `prj_${crypto.randomUUID()}`,
        slug: normalizedSlug,
        title: title.trim(),
        excerpt: "",
      });
      await createEditableProject(document);
      navigate(`/editor/${normalizedSlug}`);
    } catch (error) {
      setMessage(error.message);
      setStatus("ready");
    }
  };

  if (status === "unauthorized") {
    return (
      <main className={styles.centered}>
        <form className={styles.card} onSubmit={login}>
          <span>Portfolio CMS</span>
          <h1>관리자 로그인</h1>
          <p>{message}</p>
          <label>
            비밀번호
            <input
              autoComplete="current-password"
              autoFocus
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button type="submit">로그인</button>
        </form>
      </main>
    );
  }

  if (status === "browser") {
    return (
      <main className={styles.centered}>
        <div className={styles.card}>
          <h1>Content API가 필요합니다</h1>
          <p>
            프로젝트 목록과 생성 기능은 <code>VITE_CONTENT_API_URL</code>이
            설정된 API 저장 모드에서 사용할 수 있습니다.
          </p>
          <Link to="/editor/1min-return">기존 편집기 열기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header>
        <div>
          <span>Portfolio CMS</span>
          <h1>프로젝트</h1>
        </div>
        <span>{projects.length}개 프로젝트</span>
      </header>

      <form className={styles.createForm} onSubmit={createProject}>
        <h2>새 프로젝트</h2>
        <label>
          프로젝트 제목
          <input
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) setSlug(normalizeSlug(event.target.value));
            }}
            required
            value={title}
          />
        </label>
        <label>
          URL slug
          <input
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(normalizeSlug(event.target.value));
            }}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="new-project"
            required
            value={slug}
          />
        </label>
        <button disabled={status === "creating"} type="submit">
          {status === "creating" ? "생성 중…" : "프로젝트 생성"}
        </button>
        {message && <p role="alert">{message}</p>}
      </form>

      <section className={styles.projectList}>
        {status === "loading" && <p>프로젝트를 불러오는 중입니다.</p>}
        {projects.map((project) => (
          <article key={project.id}>
            <div>
              <span>{project.status === "published" ? "발행됨" : "초안"}</span>
              <h2>{project.title}</h2>
              <p>
                /{project.slug} · 문서 버전 {project.draftVersion}
              </p>
            </div>
            <div className={styles.projectActions}>
              {project.status === "published" && (
                <Link target="_blank" to={`/work/${project.slug}`}>
                  공개 화면
                </Link>
              )}
              <Link to={`/editor/${project.slug}`}>편집</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
