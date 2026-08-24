import { assertProjectDocument } from "../schema/validateProjectDocument";

const storagePrefix = "portfolio-project-draft:";

export function getProjectDraftKey(slug) {
  return `${storagePrefix}${slug}`;
}

export function loadProjectDraft(slug) {
  const value = window.localStorage.getItem(getProjectDraftKey(slug));
  if (!value) return null;

  try {
    return assertProjectDocument(JSON.parse(value));
  } catch {
    window.localStorage.removeItem(getProjectDraftKey(slug));
    return null;
  }
}

export function saveProjectDraft(document) {
  // Do NOT run normalizeProjectDocumentWhitespace here - it's a one-time
  // legacy-import cleanup (collapses stray indentation newlines), not an
  // ongoing sanitizer. Autosave calls this on every edit, and its trailing
  // "\n\s*$" pattern matches a perfectly normal Shift+Enter soft break the
  // instant the user pauses, silently deleting it out from under them.
  const nextDocument = {
    ...document,
    version: document.version + 1,
  };
  assertProjectDocument(nextDocument);
  window.localStorage.setItem(
    getProjectDraftKey(document.slug),
    JSON.stringify(nextDocument),
  );
  return nextDocument;
}

export function removeProjectDraft(slug) {
  window.localStorage.removeItem(getProjectDraftKey(slug));
}

export function downloadProjectDocument(document) {
  const blob = new Blob([`${JSON.stringify(document, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${document.slug}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
