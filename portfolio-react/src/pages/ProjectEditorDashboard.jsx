import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProjectDocument } from "../content/schema/projectDocument";
import { contentApiRequest } from "../content/repositories/contentApiClient";
import { createEditableProject, deleteEditableProject, getProjectRepositoryMode, listEditableProjects } from "../content/repositories/projectRepository";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
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

  const deleteProject = async (project) => {
    if (!window.confirm(`"${project.title}" 프로젝트를 삭제합니다. 되돌릴 수 없습니다. 계속할까요?`)) return;
    try {
      await deleteEditableProject(project.id, project.slug);
      await loadProjects();
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
          <Input
            autoComplete="current-password"
            autoFocus
            label="비밀번호"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <Button type="submit">로그인</Button>
        </form>
      </main>
    );
  }

  const isApiMode = getProjectRepositoryMode() === "api";

  return (
    <main className={styles.page}>
      {/* <header>
        <div>
          <span>Portfolio CMS</span>
          <h1>프로젝트</h1>
        </div>
        <span>{isApiMode ? `${projects.length}개 프로젝트` : "브라우저 저장 모드"}</span>
      </header> */}

      <form className={styles.createForm} onSubmit={createProject}>
        <h3 className={styles.createFormHeading}>새 프로젝트</h3>
        <Input
          label="프로젝트 제목"
          onChange={(event) => {
            setTitle(event.target.value);
            if (!slugTouched) setSlug(normalizeSlug(event.target.value));
          }}
          required
          size="medium"
          value={title}
        />
        <Input
          label="URL slug"
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(normalizeSlug(event.target.value));
          }}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="new-project"
          required
          size="medium"
          value={slug}
        />
        <Button className={styles.createButton} disabled={status === "creating"} size="medium" type="submit">
          {status === "creating" ? "생성 중…" : "프로젝트 생성"}
        </Button>
        {message && <p role="alert">{message}</p>}
      </form>

      <section className={styles.projectList}>
        <>
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
                <Button onClick={() => deleteProject(project)} size="small" variant="neutral">
                  삭제
                </Button>
              </div>
            </article>
          ))}
        </>
      </section>
    </main>
  );
}
