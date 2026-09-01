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

export function createProjectDraft(document) {
  assertProjectDocument(document);
  window.localStorage.setItem(
    getProjectDraftKey(document.slug),
    JSON.stringify(document),
  );
  return document;
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

// Browser-mode drafts have no server-side index to list from - each one only
// exists as a `localStorage` entry keyed by its own slug, which you'd
// already need to know to look it up. Scanning the keys directly is the only
// way to resurface previously created drafts (e.g. for the dashboard list).
export function listLocalProjectDrafts() {
  const drafts = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(storagePrefix)) continue;
    try {
      const document = assertProjectDocument(JSON.parse(window.localStorage.getItem(key)));
      drafts.push({ id: document.projectId, slug: document.slug, title: document.title, draftVersion: document.version });
    } catch {
      // A corrupt/foreign entry under this prefix shouldn't hide every other
      // valid draft from the list.
    }
  }
  return drafts;
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
