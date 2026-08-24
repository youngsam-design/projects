import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(appRoot, "src/content/projects/1min-return.json");
const legacyHtmlPath = path.resolve(appRoot, "../work/1min-return/index.html");
const outputRoot = path.join(appRoot, "src/content/projects-v2");
const outputPath = path.join(outputRoot, "1min-return.json");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const legacyHtml = await readFile(legacyHtmlPath, "utf8");
const assets = new Map();

const classVariants = {
  summary: "summary",
  intro: "intro",
  content: "content",
  hidden: "hidden",
  "full-max": "fullMax",
  "sub-title": "sectionTitle",
  "content-in": "sectionContent",
  "sub-content": "subContent",
  "img-wrap": "media",
  text: "text",
  caption: "caption",
  "text-li": "textList",
  "img-in": "contentImage",
};

function variants(attributes = {}) {
  return (attributes.class ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => classVariants[name])
    .filter(Boolean);
}

function registerAsset(kind, src) {
  const existing = [...assets.values()].find((asset) => asset.kind === kind && asset.src === src);
  if (existing) return existing.id;

  const id = `ast_1min_${String(assets.size + 1).padStart(3, "0")}`;
  assets.set(id, { id, kind, provider: "local", src });
  return id;
}

function normalizeLegacyText(value = "") {
  if (!value.includes("\n")) return value;

  return value.replace(/\s+/g, " ").trim() || " ";
}

function convertNode(node, context = { layout: "content" }) {
  if (node.type === "text") {
    return {
      id: node.id,
      type: "text",
      text: normalizeLegacyText(node.value),
      marks: [],
    };
  }

  const childBlocks = (childContext = context) => (node.children ?? []).map((child) => convertNode(child, childContext)).filter(Boolean);
  const variant = variants(node.attributes);

  if (node.tag === "section") {
    const childContext = {
      ...context,
      layout: variant.includes("fullMax") ? "full" : context.layout,
    };
    return {
      id: node.id,
      type: "section",
      variant,
      children: childBlocks(childContext),
    };
  }

  if (["div", "figure"].includes(node.tag)) {
    return { id: node.id, type: "group", variant, children: childBlocks() };
  }

  if (/^h[1-6]$/.test(node.tag)) {
    return {
      id: node.id,
      type: "heading",
      level: Number(node.tag[1]),
      variant,
      children: childBlocks(),
    };
  }

  if (node.tag === "p") {
    return { id: node.id, type: "paragraph", variant, children: childBlocks() };
  }

  if (node.tag === "q") {
    return { id: node.id, type: "quote", variant, children: childBlocks() };
  }

  if (["ul", "ol"].includes(node.tag)) {
    return {
      id: node.id,
      type: "list",
      ordered: node.tag === "ol",
      variant,
      children: childBlocks(),
    };
  }

  if (node.tag === "li") {
    return { id: node.id, type: "listItem", variant, children: childBlocks() };
  }

  if (node.tag === "span") {
    return { id: node.id, type: "span", variant, children: childBlocks() };
  }

  if (node.tag === "a") {
    return {
      id: node.id,
      type: "link",
      href: node.attributes?.href ?? "#",
      newTab: node.attributes?.target === "blank" || node.attributes?.target === "_blank",
      variant,
      children: childBlocks(),
    };
  }

  if (node.tag === "img") {
    const fileName =
      node.attributes.src
        ?.split("/")
        .pop()
        ?.replace(/\.[^.]+$/, "") ?? "image";
    return {
      id: node.id,
      type: "image",
      assetId: registerAsset("image", node.attributes.src),
      alt: node.attributes.alt || `1분 프로젝트 ${fileName} 화면`,
      layout: context.layout,
      variant,
    };
  }

  if (node.tag === "video") {
    const source = node.children?.find((child) => child.tag === "source");
    const src = node.attributes.src ?? source?.attributes?.src;
    if (!src) throw new Error(`Video '${node.id}' does not have a source`);

    return {
      id: node.id,
      type: "video",
      assetId: registerAsset("video", src),
      posterAssetId: node.attributes.poster ? registerAsset("image", node.attributes.poster) : null,
      layout: context.layout,
      variant,
      playback: {
        controls: "controls" in node.attributes,
        autoplay: "autoplay" in node.attributes,
        muted: "muted" in node.attributes,
        loop: "loop" in node.attributes,
      },
    };
  }

  if (node.tag === "br") return { id: node.id, type: "lineBreak" };
  if (node.tag === "source") return null;

  throw new Error(`Unsupported tag '${node.tag}' at ${node.id}`);
}

function findNode(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) {
    const match = findNode(child, predicate);
    if (match) return match;
  }
  return null;
}

function nodeText(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  return (node.children ?? []).map(nodeText).join("").replace(/\s+/g, " ").trim();
}

function legacyValue(pattern, fallback = "") {
  return legacyHtml.match(pattern)?.[1]?.trim() ?? fallback;
}

const relatedRoot = source.blocks.find((block) => block.attributes?.class?.split(/\s+/).includes("project"));
const relatedCards = [];

function collectRelatedCards(node) {
  if (node.tag === "li" && node.attributes?.class?.split(/\s+/).includes("card")) {
    const link = findNode(node, (child) => child.tag === "a");
    const thumbnail = findNode(node, (child) => child.attributes?.["data-url"]);
    const eyebrow = findNode(node, (child) => child.attributes?.class?.split(/\s+/).includes("category-eyebrow"));
    const headline = findNode(node, (child) => child.attributes?.class?.split(/\s+/).includes("title-content-headline"));
    const slug = link?.attributes?.href?.match(/\.\.\/([^/]+)\/?/)?.[1];

    if (slug && thumbnail) {
      relatedCards.push({
        id: `related_${slug}`,
        slug,
        category: nodeText(eyebrow),
        title: nodeText(headline),
        thumbnailAssetId: registerAsset("image", thumbnail.attributes["data-url"]),
      });
    }
  }

  node.children?.forEach(collectRelatedCards);
}

if (relatedRoot) collectRelatedCards(relatedRoot);

const summaryRoot = source.blocks.find((block) => block.attributes?.class?.split(/\s+/).includes("summary"));
const projectMeta = [];

function collectProjectMeta(node) {
  if (node.tag === "li") {
    const label = findNode(node, (child) => child.attributes?.class?.split(/\s+/).includes("sp-title"));
    const value = findNode(node, (child) => child.attributes?.class?.split(/\s+/).includes("sp-text"));
    if (label && value) {
      projectMeta.push({
        id: `meta_${projectMeta.length + 1}`,
        label: nodeText(label),
        value: nodeText(value),
      });
    }
  }
  node.children?.forEach(collectProjectMeta);
}

if (summaryRoot) collectProjectMeta(summaryRoot);

const heroCover = legacyValue(/<div class="slider-bg"[^>]*data-url="url\(([^)]+)\)"/);
const heroCoverAssetId = registerAsset("image", heroCover);

const editorialBlocks = source.blocks.filter((block) => {
  if (block.type === "text") return true;
  const classes = block.attributes?.class?.split(/\s+/) ?? [];
  return !classes.includes("summary") && !classes.includes("project") && block.tag !== "footer";
});

const legacyStyles = legacyValue(/<style>([\s\S]*?)<\/style>/);

const document = {
  schemaVersion: 2,
  projectId: "prj_1min_return",
  slug: "1min-return",
  title: "1달간 '1분'으로 이뤄낸 것들",
  excerpt: "근로소득자를 위한 간편 환급 서비스 1분의 브랜딩과 제품 개발",
  pageMeta: {
    title: legacyValue(/<title>([\s\S]*?)<\/title>/, "Youngsam's Projects"),
    bodyClass: legacyValue(/<body class="([^"]*)"/),
    bodyStyle: legacyValue(/<body[^>]*style="([^"]*)"/),
    styles: legacyStyles.replace(/:root\s*\{[\s\S]*?\}/, "").trim(),
  },
  hero: {
    eyebrow: legacyValue(/<span class="category-eyebrow">([\s\S]*?)<\/span>/),
    headline: legacyValue(/<h1 class="title-content-headline">([\s\S]*?)<\/h1>/).replace(/<[^>]+>/g, ""),
    coverAssetId: heroCoverAssetId,
  },
  theme: {
    mainColor: "13, 154, 255",
    backgroundColor: "255, 255, 255",
    textColor: "0, 39, 77",
    menuColor: "255, 255, 255",
  },
  meta: projectMeta,
  relatedProjects: relatedCards,
  assets: [...assets.values()],
  blocks: editorialBlocks.map((block) => convertNode(block)).filter(Boolean),
  version: 1,
};

// Assets are registered while blocks are converted.
document.assets = [...assets.values()];

await mkdir(outputRoot, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Migrated ${document.blocks.length} blocks and ${document.assets.length} assets.`);
