import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Dev-only endpoint the editor's "파일로 내보내기" button posts to. It writes
// the current draft straight into src/content/projects-v2/<slug>.json so a
// browser-mode edit (no remote content API) can become the live content by
// committing that file, without needing a real backend.
function exportProjectDraftPlugin() {
  return {
    name: "export-project-draft",
    configureServer(server) {
      server.middlewares.use("/__editor-api/export-project", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", async () => {
          res.setHeader("Content-Type", "application/json");
          try {
            const { slug, document } = JSON.parse(
              Buffer.concat(chunks).toString("utf-8"),
            );
            if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "invalid slug" }));
              return;
            }
            const relativePath = `src/content/projects-v2/${slug}.json`;
            const filePath = path.join(projectRoot, relativePath);
            await fs.writeFile(
              filePath,
              `${JSON.stringify(document, null, 2)}\n`,
              "utf-8",
            );
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, path: relativePath }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), exportProjectDraftPlugin()],
  base: "/projects/",
  server: {
    fs: {
      allow: [".."],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
