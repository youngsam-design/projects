import { validateProjectDocument } from "../../src/content/schema/validateProjectDocument.js";

const encoder = new TextEncoder();
const allowedKinds = new Set(["image", "video", "file"]);
const maximumUploadBytes = 100 * 1024 * 1024;

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = env.ALLOWED_ORIGIN;
  return {
    ...(origin && origin === allowed
      ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          Vary: "Origin",
        }
      : {}),
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  };
}

function json(request, env, body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders(request, env), ...headers },
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Response("Invalid JSON", { status: 400 });
  }
}

function toBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sign(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
  );
}

function secureEqual(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") ?? "";
  for (const item of cookies.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return parts.join("=");
  }
  return null;
}

async function isAdmin(request, env) {
  const session = getCookie(request, "portfolio_admin");
  if (!session) return false;
  const [expires, signature] = session.split(".");
  if (!expires || !signature || Number(expires) <= Date.now()) return false;
  const expected = await sign(env.SESSION_SECRET, `admin:${expires}`);
  return secureEqual(signature, expected);
}

async function requireAdmin(request, env) {
  if (!(await isAdmin(request, env))) {
    throw json(request, env, { message: "Authentication required" }, 401);
  }
}

function validateDocument(document) {
  const result = validateProjectDocument(document);
  if (!result.valid)
    throw Response.json(
      { message: "Invalid project document", errors: result.errors },
      { status: 400 },
    );
}

async function createSession(request, env) {
  const body = await readJson(request);
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json(
      request,
      env,
      { message: "Server auth secrets are not configured" },
      503,
    );
  }
  if (
    typeof body.password !== "string" ||
    !secureEqual(body.password, env.ADMIN_PASSWORD)
  ) {
    return json(request, env, { message: "Invalid credentials" }, 401);
  }
  const ttl = Number(env.SESSION_TTL_SECONDS || 86400);
  const expires = Date.now() + ttl * 1000;
  const signature = await sign(env.SESSION_SECRET, `admin:${expires}`);
  const secure = new URL(request.url).protocol === "https:";
  const cookie = `portfolio_admin=${expires}.${signature}; Path=/; HttpOnly; ${secure ? "Secure; SameSite=None" : "SameSite=Lax"}; Max-Age=${ttl}`;
  return json(request, env, { authenticated: true }, 200, {
    "Set-Cookie": cookie,
  });
}

function deleteSession(request, env) {
  const secure = new URL(request.url).protocol === "https:";
  return json(request, env, { authenticated: false }, 200, {
    "Set-Cookie": `portfolio_admin=; Path=/; HttpOnly; ${secure ? "Secure; SameSite=None" : "SameSite=Lax"}; Max-Age=0`,
  });
}

async function getProject(request, env, projectId) {
  await requireAdmin(request, env);
  const project = await env.DB.prepare(
    "SELECT draft_document, status, published_version, published_at FROM projects WHERE id = ?",
  )
    .bind(projectId)
    .first();
  if (!project)
    return json(request, env, { message: "Project not found" }, 404);
  return json(request, env, {
    document: JSON.parse(project.draft_document),
    status: project.status,
    publishedVersion: project.published_version,
    publishedAt: project.published_at,
  });
}

async function getProjectBySlug(request, env, slug) {
  await requireAdmin(request, env);
  const project = await env.DB.prepare(
    "SELECT draft_document, status, published_version, published_at FROM projects WHERE slug = ?",
  )
    .bind(slug)
    .first();
  if (!project)
    return json(request, env, { message: "Project not found" }, 404);
  return json(request, env, {
    document: JSON.parse(project.draft_document),
    status: project.status,
    publishedVersion: project.published_version,
    publishedAt: project.published_at,
  });
}

async function listProjects(request, env) {
  await requireAdmin(request, env);
  const result = await env.DB.prepare(
    `SELECT id, slug, title, excerpt, status, draft_version,
      published_version, published_at, updated_at
     FROM projects ORDER BY updated_at DESC LIMIT 100`,
  ).all();
  return json(request, env, {
    projects: result.results.map((project) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      excerpt: project.excerpt,
      status: project.status,
      draftVersion: project.draft_version,
      publishedVersion: project.published_version,
      publishedAt: project.published_at,
      updatedAt: project.updated_at,
    })),
  });
}

async function assertPublishableAssets(request, env, document) {
  for (const asset of document.assets ?? []) {
    if (asset.provider !== "r2") continue;
    const stored = await env.DB.prepare(
      "SELECT status FROM assets WHERE id = ? AND project_id = ?",
    )
      .bind(asset.id, document.projectId)
      .first();
    if (stored?.status !== "ready") {
      return json(
        request,
        env,
        { message: `Asset '${asset.id}' is not ready to publish` },
        409,
      );
    }
  }
  return null;
}

async function publishProject(request, env, projectId) {
  await requireAdmin(request, env);
  const project = await env.DB.prepare(
    "SELECT draft_document, draft_version FROM projects WHERE id = ?",
  )
    .bind(projectId)
    .first();
  if (!project)
    return json(request, env, { message: "Project not found" }, 404);
  const document = JSON.parse(project.draft_document);
  validateDocument(document);
  const assetError = await assertPublishableAssets(request, env, document);
  if (assetError) return assetError;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE projects SET status = 'published', published_document = ?,
      published_version = ?, published_at = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(project.draft_document, project.draft_version, now, now, projectId)
    .run();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO project_revisions (id, project_id, version, document, reason, created_at) VALUES (?, ?, ?, ?, 'publish', ?)",
  )
    .bind(
      crypto.randomUUID(),
      projectId,
      project.draft_version,
      project.draft_document,
      now,
    )
    .run();
  return json(request, env, {
    status: "published",
    publishedVersion: project.draft_version,
    publishedAt: now,
  });
}

async function unpublishProject(request, env, projectId) {
  await requireAdmin(request, env);
  const result = await env.DB.prepare(
    `UPDATE projects SET status = 'draft', published_document = NULL,
      published_version = NULL, published_at = NULL, updated_at = ? WHERE id = ?`,
  )
    .bind(new Date().toISOString(), projectId)
    .run();
  if (!result.meta.changes)
    return json(request, env, { message: "Project not found" }, 404);
  return json(request, env, { status: "draft" });
}

async function listRevisions(request, env, projectId) {
  await requireAdmin(request, env);
  const result = await env.DB.prepare(
    `SELECT id, version, reason, created_at FROM project_revisions
      WHERE project_id = ? ORDER BY version DESC LIMIT 50`,
  )
    .bind(projectId)
    .all();
  return json(request, env, {
    revisions: result.results.map((revision) => ({
      id: revision.id,
      version: revision.version,
      reason: revision.reason,
      createdAt: revision.created_at,
    })),
  });
}

async function restoreRevision(request, env, projectId, revisionId) {
  await requireAdmin(request, env);
  const [project, revision] = await Promise.all([
    env.DB.prepare("SELECT draft_version FROM projects WHERE id = ?")
      .bind(projectId)
      .first(),
    env.DB.prepare(
      "SELECT document FROM project_revisions WHERE id = ? AND project_id = ?",
    )
      .bind(revisionId, projectId)
      .first(),
  ]);
  if (!project || !revision)
    return json(request, env, { message: "Revision not found" }, 404);
  const restored = {
    ...JSON.parse(revision.document),
    version: project.draft_version + 1,
  };
  validateDocument(restored);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE projects SET title = ?, excerpt = ?, draft_document = ?,
      draft_version = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(
      restored.title,
      restored.excerpt ?? "",
      JSON.stringify(restored),
      restored.version,
      now,
      projectId,
    )
    .run();
  await env.DB.prepare(
    "INSERT INTO project_revisions (id, project_id, version, document, reason, created_at) VALUES (?, ?, ?, ?, 'restore', ?)",
  )
    .bind(
      crypto.randomUUID(),
      projectId,
      restored.version,
      JSON.stringify(restored),
      now,
    )
    .run();
  return json(request, env, { document: restored });
}

async function getPublishedProject(request, env, slug) {
  const project = await env.DB.prepare(
    "SELECT published_document FROM projects WHERE slug = ? AND status = 'published'",
  )
    .bind(slug)
    .first();
  if (!project)
    return json(request, env, { message: "Published project not found" }, 404);
  return json(request, env, {
    document: JSON.parse(project.published_document),
  });
}

async function listPublishedProjects(request, env) {
  const result = await env.DB.prepare(
    `SELECT published_document, published_at FROM projects
     WHERE status = 'published' AND published_document IS NOT NULL
     ORDER BY published_at DESC LIMIT 100`,
  ).all();
  const projects = result.results.map((row) => {
    const document = JSON.parse(row.published_document);
    const cover = document.assets.find(
      (asset) => asset.id === document.hero.coverAssetId,
    );
    return {
      id: document.projectId,
      slug: document.slug,
      title: document.title,
      excerpt: document.excerpt,
      eyebrow: document.hero.eyebrow,
      category:
        document.meta.find((item) => item.label.toLowerCase() === "role")
          ?.value ?? "Project",
      coverUrl: cover?.src ?? null,
      publishedAt: row.published_at,
    };
  });
  return json(request, env, { projects });
}

async function createProject(request, env) {
  await requireAdmin(request, env);
  const { document } = await readJson(request);
  validateDocument(document);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO projects
      (id, slug, title, excerpt, status, draft_document, draft_version, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
  )
    .bind(
      document.projectId,
      document.slug,
      document.title,
      document.excerpt ?? "",
      JSON.stringify(document),
      document.version,
      now,
      now,
    )
    .run();
  return json(request, env, { document }, 201);
}

async function updateProject(request, env, projectId) {
  await requireAdmin(request, env);
  const { expectedVersion, document } = await readJson(request);
  validateDocument(document);
  if (
    document.projectId !== projectId ||
    expectedVersion !== document.version
  ) {
    return json(
      request,
      env,
      { message: "Project identity or version does not match" },
      400,
    );
  }
  const nextDocument = { ...document, version: expectedVersion + 1 };
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE projects SET title = ?, excerpt = ?, draft_document = ?,
      draft_version = ?, updated_at = ? WHERE id = ? AND draft_version = ?`,
  )
    .bind(
      nextDocument.title,
      nextDocument.excerpt ?? "",
      JSON.stringify(nextDocument),
      nextDocument.version,
      now,
      projectId,
      expectedVersion,
    )
    .run();
  if (!result.meta.changes) {
    const current = await env.DB.prepare(
      "SELECT draft_version FROM projects WHERE id = ?",
    )
      .bind(projectId)
      .first();
    return json(
      request,
      env,
      {
        message: "Draft version conflict",
        currentVersion: current?.draft_version,
      },
      409,
    );
  }
  await env.DB.prepare(
    "INSERT INTO project_revisions (id, project_id, version, document, reason, created_at) VALUES (?, ?, ?, ?, 'manual-save', ?)",
  )
    .bind(
      crypto.randomUUID(),
      projectId,
      nextDocument.version,
      JSON.stringify(nextDocument),
      now,
    )
    .run();
  return json(request, env, { document: nextDocument });
}

function safeExtension(fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  return /^[a-z0-9]{1,10}$/.test(extension) ? extension : "bin";
}

async function initializeUpload(request, env) {
  await requireAdmin(request, env);
  const body = await readJson(request);
  if (!allowedKinds.has(body.kind) || !body.mimeType || !body.fileName) {
    return json(request, env, { message: "Unsupported upload metadata" }, 400);
  }
  if (
    !Number.isInteger(body.byteSize) ||
    body.byteSize < 1 ||
    body.byteSize > maximumUploadBytes
  ) {
    return json(
      request,
      env,
      { message: "Upload must be between 1 byte and 100MB" },
      400,
    );
  }
  const assetId = `ast_${crypto.randomUUID()}`;
  const storageKey = `${body.projectId}/${assetId}.${safeExtension(body.fileName)}`;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO assets
      (id, project_id, kind, provider, storage_key, mime_type, original_name, byte_size, status, created_at, updated_at)
     VALUES (?, ?, ?, 'r2', ?, ?, ?, ?, 'pending', ?, ?)`,
  )
    .bind(
      assetId,
      body.projectId,
      body.kind,
      storageKey,
      body.mimeType,
      body.fileName,
      body.byteSize,
      now,
      now,
    )
    .run();
  const expires = Date.now() + Number(env.UPLOAD_TTL_SECONDS || 900) * 1000;
  const token = await sign(env.UPLOAD_SECRET, `${assetId}:${expires}`);
  const url = new URL(request.url);
  const uploadUrl = `${url.origin}/api/admin/uploads/${assetId}/content?expires=${expires}&token=${token}`;
  return json(request, env, {
    assetId,
    upload: {
      method: "PUT",
      url: uploadUrl,
      headers: { "Content-Type": body.mimeType },
      expiresAt: new Date(expires).toISOString(),
    },
  });
}

async function uploadContent(request, env, assetId, url) {
  const expires = url.searchParams.get("expires") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (Number(expires) <= Date.now())
    return json(request, env, { message: "Upload URL expired" }, 401);
  const expected = await sign(env.UPLOAD_SECRET, `${assetId}:${expires}`);
  if (!secureEqual(token, expected))
    return json(request, env, { message: "Invalid upload token" }, 401);
  const asset = await env.DB.prepare(
    "SELECT * FROM assets WHERE id = ? AND status = 'pending'",
  )
    .bind(assetId)
    .first();
  if (!asset) return json(request, env, { message: "Upload not found" }, 404);
  if (request.headers.get("Content-Type") !== asset.mime_type) {
    return json(request, env, { message: "Content-Type does not match" }, 400);
  }
  await env.MEDIA.put(asset.storage_key, request.body, {
    httpMetadata: { contentType: asset.mime_type },
    customMetadata: { assetId, projectId: asset.project_id },
  });
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env),
  });
}

async function completeUpload(request, env, assetId) {
  await requireAdmin(request, env);
  const asset = await env.DB.prepare("SELECT * FROM assets WHERE id = ?")
    .bind(assetId)
    .first();
  if (!asset) return json(request, env, { message: "Asset not found" }, 404);
  const object = await env.MEDIA.head(asset.storage_key);
  if (!object || object.size !== asset.byte_size) {
    return json(
      request,
      env,
      { message: "Uploaded object size does not match" },
      409,
    );
  }
  const publicUrl = env.MEDIA_PUBLIC_URL
    ? `${env.MEDIA_PUBLIC_URL.replace(/\/$/, "")}/${asset.storage_key}`
    : `${new URL(request.url).origin}/api/public/assets/${assetId}`;
  await env.DB.prepare(
    "UPDATE assets SET status = 'ready', public_url = ?, updated_at = ? WHERE id = ?",
  )
    .bind(publicUrl, new Date().toISOString(), assetId)
    .run();
  return json(request, env, {
    asset: {
      id: asset.id,
      kind: asset.kind,
      provider: "r2",
      src: publicUrl,
      name: asset.original_name,
      mimeType: asset.mime_type,
      size: asset.byte_size,
    },
  });
}

async function serveAsset(request, env, assetId) {
  const asset = await env.DB.prepare(
    "SELECT storage_key, mime_type FROM assets WHERE id = ? AND status = 'ready'",
  )
    .bind(assetId)
    .first();
  if (!asset) return json(request, env, { message: "Asset not found" }, 404);
  const object = await env.MEDIA.get(asset.storage_key, {
    range: request.headers,
  });
  if (!object) return json(request, env, { message: "Object not found" }, 404);
  const headers = new Headers(corsHeaders(request, env));
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}

async function deleteAsset(request, env, assetId) {
  await requireAdmin(request, env);
  const asset = await env.DB.prepare(
    "SELECT storage_key FROM assets WHERE id = ?",
  )
    .bind(assetId)
    .first();
  if (!asset) return json(request, env, { message: "Asset not found" }, 404);
  await env.MEDIA.delete(asset.storage_key);
  await env.DB.prepare(
    "UPDATE assets SET status = 'deleted', updated_at = ? WHERE id = ?",
  )
    .bind(new Date().toISOString(), assetId)
    .run();
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env),
  });
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (request.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, env),
    });
  if (path === "/api/admin/session" && request.method === "POST")
    return createSession(request, env);
  if (path === "/api/admin/session" && request.method === "DELETE")
    return deleteSession(request, env);
  if (path === "/api/admin/projects" && request.method === "POST")
    return createProject(request, env);
  if (path === "/api/admin/projects" && request.method === "GET")
    return listProjects(request, env);
  if (path === "/api/admin/uploads/init" && request.method === "POST")
    return initializeUpload(request, env);

  let match = path.match(/^\/api\/admin\/projects\/([^/]+)$/);
  if (match && request.method === "GET")
    return getProject(request, env, decodeURIComponent(match[1]));
  if (match && request.method === "PATCH")
    return updateProject(request, env, decodeURIComponent(match[1]));
  match = path.match(/^\/api\/admin\/projects\/by-slug\/([^/]+)$/);
  if (match && request.method === "GET")
    return getProjectBySlug(request, env, decodeURIComponent(match[1]));
  match = path.match(/^\/api\/admin\/projects\/([^/]+)\/publish$/);
  if (match && request.method === "POST")
    return publishProject(request, env, decodeURIComponent(match[1]));
  match = path.match(/^\/api\/admin\/projects\/([^/]+)\/unpublish$/);
  if (match && request.method === "POST")
    return unpublishProject(request, env, decodeURIComponent(match[1]));
  match = path.match(/^\/api\/admin\/projects\/([^/]+)\/revisions$/);
  if (match && request.method === "GET")
    return listRevisions(request, env, decodeURIComponent(match[1]));
  match = path.match(
    /^\/api\/admin\/projects\/([^/]+)\/revisions\/([^/]+)\/restore$/,
  );
  if (match && request.method === "POST")
    return restoreRevision(
      request,
      env,
      decodeURIComponent(match[1]),
      decodeURIComponent(match[2]),
    );
  match = path.match(/^\/api\/admin\/uploads\/([^/]+)\/content$/);
  if (match && request.method === "PUT")
    return uploadContent(request, env, decodeURIComponent(match[1]), url);
  match = path.match(/^\/api\/admin\/uploads\/([^/]+)\/complete$/);
  if (match && request.method === "POST")
    return completeUpload(request, env, decodeURIComponent(match[1]));
  match = path.match(/^\/api\/admin\/assets\/([^/]+)$/);
  if (match && request.method === "DELETE")
    return deleteAsset(request, env, decodeURIComponent(match[1]));
  match = path.match(/^\/api\/public\/assets\/([^/]+)$/);
  if (match && request.method === "GET")
    return serveAsset(request, env, decodeURIComponent(match[1]));
  match = path.match(/^\/api\/public\/projects\/([^/]+)$/);
  if (match && request.method === "GET")
    return getPublishedProject(request, env, decodeURIComponent(match[1]));
  if (path === "/api/public/projects" && request.method === "GET")
    return listPublishedProjects(request, env);
  return json(request, env, { message: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      if (error instanceof Response) {
        const headers = new Headers(error.headers);
        for (const [name, value] of Object.entries(corsHeaders(request, env)))
          headers.set(name, value);
        return new Response(error.body, { status: error.status, headers });
      }
      console.error(error);
      return json(request, env, { message: "Internal server error" }, 500);
    }
  },
};
