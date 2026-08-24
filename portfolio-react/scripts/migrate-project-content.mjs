import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import parse from "html-dom-parser";
import { findOne } from "domutils";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const sourceRoot = path.join(projectRoot, "work");
const outputRoot = path.join(
  projectRoot,
  "portfolio-react/src/content/projects",
);

const blockTags = new Set([
  "div",
  "section",
  "article",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "q",
  "ul",
  "ol",
  "li",
  "figure",
  "video",
]);

function normalizeLegacyText(value = "") {
  if (!value.includes("\n")) return value;

  return value.replace(/\s+/g, " ").trim() || " ";
}

function toBlock(node, id) {
  if (node.type === "text") {
    return {
      id,
      type: "text",
      value: normalizeLegacyText(node.data),
    };
  }

  if (node.type !== "tag") return null;

  const children = (node.children ?? [])
    .map((child, index) => toBlock(child, `${id}.${index + 1}`))
    .filter(Boolean);

  return {
    id,
    type: blockTags.has(node.name) ? "block" : "inline",
    tag: node.name,
    attributes: node.attribs ?? {},
    children,
  };
}

await mkdir(outputRoot, { recursive: true });

const slugs = (await readdir(sourceRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const manifest = {};

for (const slug of slugs) {
  const sourcePath = path.join(sourceRoot, slug, "index.html");
  let html;

  try {
    html = await readFile(sourcePath, "utf8");
  } catch {
    continue;
  }

  const document = parse(html);
  const contents = findOne(
    (node) =>
      node.type === "tag" &&
      node.attribs?.class?.split(/\s+/).includes("contents"),
    document,
    true,
  );

  if (!contents) continue;

  const blocks = contents.children
    .map((node, index) => toBlock(node, `${slug}-${index + 1}`))
    .filter(Boolean);
  const fileName = `${slug}.json`;

  await writeFile(
    path.join(outputRoot, fileName),
    `${JSON.stringify({ schemaVersion: 1, slug, blocks }, null, 2)}\n`,
  );
  manifest[slug] = fileName;
}

await writeFile(
  path.join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Migrated ${Object.keys(manifest).length} project descriptions.`);
