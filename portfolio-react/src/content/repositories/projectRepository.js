import {
  createProjectDraft,
  loadProjectDraft,
  removeProjectDraft,
  saveProjectDraft,
} from "../editor/projectDraftStorage";
import { normalizeListItemParagraphVariant } from "../editor/projectDocumentOperations";
import { assertProjectDocument } from "../schema/validateProjectDocument";
import { normalizeProjectDocumentWhitespace } from "../schema/blockText";
import { contentApiRequest, hasRemoteContentApi } from "./contentApiClient";

const extractDocument = (response) =>
  response?.document ?? response?.draftDocument ?? response;

export function getProjectRepositoryMode() {
  return hasRemoteContentApi() ? "api" : "browser";
}

export async function loadEditableProject(sourceDocument) {
  if (!hasRemoteContentApi()) {
    return normalizeListItemParagraphVariant(
      normalizeProjectDocumentWhitespace(
        loadProjectDraft(sourceDocument.slug) ?? structuredClone(sourceDocument)
      ),
    );
  }
  let response;
  try {
    response = await contentApiRequest(
      `/api/admin/projects/${encodeURIComponent(sourceDocument.projectId)}`,
    );
  } catch (error) {
    if (error.status !== 404) throw error;
    response = await contentApiRequest("/api/admin/projects", {
      method: "POST",
      body: JSON.stringify({ document: sourceDocument }),
    });
  }
  return assertProjectDocument(
    normalizeListItemParagraphVariant(
      normalizeProjectDocumentWhitespace(extractDocument(response)),
    ),
  );
}

export async function loadEditableProjectBySlug(slug) {
  if (!hasRemoteContentApi()) return loadProjectDraft(slug);
  const response = await contentApiRequest(
    `/api/admin/projects/by-slug/${encodeURIComponent(slug)}`,
  );
  return assertProjectDocument(
    normalizeListItemParagraphVariant(
      normalizeProjectDocumentWhitespace(extractDocument(response)),
    ),
  );
}

export async function listEditableProjects() {
  if (!hasRemoteContentApi()) return [];
  const response = await contentApiRequest("/api/admin/projects");
  return response.projects;
}

export async function createEditableProject(document) {
  if (!hasRemoteContentApi()) {
    if (loadProjectDraft(document.slug))
      throw new Error(`이미 사용 중인 slug입니다: ${document.slug}`);
    return createProjectDraft(document);
  }
  const response = await contentApiRequest("/api/admin/projects", {
    method: "POST",
    body: JSON.stringify({ document }),
  });
  return assertProjectDocument(extractDocument(response));
}

export async function saveEditableProject(document) {
  if (!hasRemoteContentApi()) return saveProjectDraft(document);
  // No normalizeProjectDocumentWhitespace here - see the comment in
  // saveProjectDraft. It's a one-time legacy-import cleanup, not something
  // to re-run on every save of live-edited content.
  const response = await contentApiRequest(
    `/api/admin/projects/${encodeURIComponent(document.projectId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        expectedVersion: document.version,
        document,
      }),
    },
  );
  return assertProjectDocument(extractDocument(response));
}

export async function resetEditableProject(document) {
  if (hasRemoteContentApi())
    throw new Error("API 초안은 revision 복원 기능으로 되돌려야 합니다.");
  removeProjectDraft(document.slug);
}

export async function getProjectPublication(projectId) {
  if (!hasRemoteContentApi()) return { status: "local" };
  const response = await contentApiRequest(
    `/api/admin/projects/${encodeURIComponent(projectId)}`,
  );
  return {
    status: response.status,
    publishedVersion: response.publishedVersion,
    publishedAt: response.publishedAt,
  };
}

export async function publishEditableProject(document) {
  if (!hasRemoteContentApi())
    throw new Error("API 저장 모드에서만 발행할 수 있습니다.");
  const saved = await saveEditableProject(document);
  const publication = await contentApiRequest(
    `/api/admin/projects/${encodeURIComponent(saved.projectId)}/publish`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return { document: saved, publication };
}

export async function unpublishEditableProject(projectId) {
  if (!hasRemoteContentApi())
    throw new Error("API 저장 모드에서만 발행을 취소할 수 있습니다.");
  return contentApiRequest(
    `/api/admin/projects/${encodeURIComponent(projectId)}/unpublish`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function listProjectRevisions(projectId) {
  if (!hasRemoteContentApi()) return [];
  const response = await contentApiRequest(
    `/api/admin/projects/${encodeURIComponent(projectId)}/revisions`,
  );
  return response.revisions;
}

export async function restoreProjectRevision(projectId, revisionId) {
  const response = await contentApiRequest(
    `/api/admin/projects/${encodeURIComponent(projectId)}/revisions/${encodeURIComponent(revisionId)}/restore`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return assertProjectDocument(extractDocument(response));
}
