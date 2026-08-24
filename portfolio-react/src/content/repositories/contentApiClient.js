const apiBaseUrl = (import.meta.env.VITE_CONTENT_API_URL ?? "").replace(
  /\/$/,
  "",
);

export function hasRemoteContentApi() {
  return Boolean(apiBaseUrl);
}

export async function contentApiRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      body?.message ?? `Content API request failed (${response.status})`,
    );
    error.status = response.status;
    error.details = body;
    throw error;
  }
  return body;
}

export function uploadToPresignedUrl(upload, file, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(upload.method ?? "PUT", upload.url);
    for (const [name, value] of Object.entries(upload.headers ?? {})) {
      request.setRequestHeader(name, value);
    }
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`File upload failed (${request.status})`));
    request.onerror = () => reject(new Error("File upload network error"));
    request.send(file);
  });
}
