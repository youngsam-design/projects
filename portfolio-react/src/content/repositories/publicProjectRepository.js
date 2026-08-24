import { assertProjectDocument } from "../schema/validateProjectDocument";
import { contentApiRequest, hasRemoteContentApi } from "./contentApiClient";

export function usesPublishedProjectApi() {
  return hasRemoteContentApi();
}

export async function loadPublishedProject(slug) {
  if (!hasRemoteContentApi()) return null;
  try {
    const response = await contentApiRequest(
      `/api/public/projects/${encodeURIComponent(slug)}`,
    );
    return assertProjectDocument(response.document);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function loadPublishedProjects() {
  if (!hasRemoteContentApi()) return [];
  const response = await contentApiRequest("/api/public/projects");
  return response.projects;
}
