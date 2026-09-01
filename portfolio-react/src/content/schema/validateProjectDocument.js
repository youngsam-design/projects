import { allowedLayouts, allowedMarks, allowedSpacerSizes, allowedVariants, assetKinds, assetProviders, blockTypeSet } from "./blockTypes.js";
import { codeLanguageValues } from "./codeLanguages.js";
import { projectDocumentVersion } from "./projectDocument.js";

const allowedLayoutSet = new Set(allowedLayouts);
const allowedSpacerSizeSet = new Set(allowedSpacerSizes);
const allowedMarkSet = new Set(allowedMarks);
const allowedVariantSet = new Set(allowedVariants);
const assetKindSet = new Set(assetKinds);
const assetProviderSet = new Set(assetProviders);
const codeLanguageValueSet = new Set(codeLanguageValues);
const richContentTypes = new Set(["text", "span", "link", "lineBreak"]);
const rootTypes = new Set(["section", "group", "heading", "paragraph", "quote", "list", "image", "video", "text", "divider", "spacer", "callout", "codeBlock", "table", "embed"]);
const containerTypes = new Set(["section", "group", "listItem", "callout", "tableCell"]);
const leafTypes = new Set(["text", "image", "video", "lineBreak", "divider", "spacer", "codeBlock", "embed"]);

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function validateVariants(block, path, errors) {
  if (block.variant === undefined) return;
  if (!Array.isArray(block.variant)) {
    errors.push(`${path}: variant must be an array`);
    return;
  }
  for (const variant of block.variant) {
    if (!allowedVariantSet.has(variant)) errors.push(`${path}: unsupported variant '${variant}'`);
  }
}

function validateGrid(block, path, errors) {
  if (block.grid === undefined) return;
  if (!isObject(block.grid)) {
    errors.push(`${path}: grid must be an object`);
    return;
  }
  if (!Number.isInteger(block.grid.span) || block.grid.span < 1 || block.grid.span > 14) {
    errors.push(`${path}: grid.span must be an integer from 1 to 14`);
  }
  if (block.grid.align !== undefined && !["start", "center", "end"].includes(block.grid.align)) {
    errors.push(`${path}: grid.align must be start, center, or end`);
  }
}

function validateChildren(block, path, errors) {
  if (leafTypes.has(block.type)) {
    if (block.children !== undefined) errors.push(`${path}: '${block.type}' cannot have children`);
    return [];
  }
  if (!Array.isArray(block.children)) {
    errors.push(`${path}: '${block.type}' must have a children array`);
    return [];
  }
  return block.children;
}

function validateChildType(parent, child, path, errors) {
  if (!child?.type) return;
  if (parent.variant?.includes("contentSection") && ["list", "listItem"].includes(child.type)) {
    errors.push(`${path}: contentSection children must be independent row blocks`);
    return;
  }
  if (["heading", "paragraph", "quote", "span", "link"].includes(parent.type)) {
    if (!richContentTypes.has(child.type)) {
      errors.push(`${path}: '${parent.type}' cannot contain '${child.type}'`);
    }
    return;
  }
  if (parent.type === "list") {
    if (child.type !== "listItem" && !(child.type === "text" && !child.text?.trim())) {
      errors.push(`${path}: list can only contain listItem blocks`);
    }
    return;
  }
  if (parent.type === "table") {
    if (child.type !== "tableRow") errors.push(`${path}: table can only contain tableRow blocks`);
    return;
  }
  if (parent.type === "tableRow") {
    if (child.type !== "tableCell") errors.push(`${path}: tableRow can only contain tableCell blocks`);
    return;
  }
  if (containerTypes.has(parent.type) && child.type === "text" && child.text?.trim()) {
    errors.push(`${path}: meaningful text must be wrapped in a text block parent`);
  }
}

function validateSectionStructure(block, children, path, errors) {
  const contentSectionBlocks = children.filter((child) => child?.type === "group" && child.variant?.includes("contentSection"));

  if (block.type !== "section") return;

  if (block.variant?.includes("content")) {
    if (contentSectionBlocks.length !== 1) {
      errors.push(`${path}: the content section must contain exactly one contentSection group`);
    }
  }
}

function validateAssetReference(block, field, kind, path, errors, assets) {
  const assetId = block[field];
  if (!assetId) {
    errors.push(`${path}: ${field} is required`);
    return;
  }
  const asset = assets.get(assetId);
  if (!asset) errors.push(`${path}: ${field} must reference a document asset`);
  else if (asset.kind !== kind) errors.push(`${path}: ${field} must reference a ${kind} asset`);
}

function validateBlock(block, path, errors, ids, assets) {
  if (!isObject(block)) {
    errors.push(`${path}: block must be an object`);
    return;
  }
  if (!block.id || typeof block.id !== "string") errors.push(`${path}: id is required`);
  else if (ids.has(block.id)) errors.push(`${path}: duplicate id '${block.id}'`);
  else ids.add(block.id);

  if (!blockTypeSet.has(block.type)) {
    errors.push(`${path}: unsupported type '${block.type}'`);
    return;
  }
  validateVariants(block, path, errors);
  validateGrid(block, path, errors);

  if (block.type === "text") {
    if (block.text !== undefined && block.text !== null && typeof block.text !== "string") errors.push(`${path}: text must be a string when provided`);
    if (!Array.isArray(block.marks)) errors.push(`${path}: marks must be an array`);
    else
      for (const mark of block.marks) {
        if (!allowedMarkSet.has(mark)) errors.push(`${path}: unsupported mark '${mark}'`);
      }
  }
  if (block.type === "heading" && (!Number.isInteger(block.level) || block.level < 1 || block.level > 6)) {
    errors.push(`${path}: heading level must be an integer from 1 to 6`);
  }
  if (block.type === "list" && typeof block.ordered !== "boolean") {
    errors.push(`${path}: ordered must be a boolean`);
  }
  if (block.type === "spacer" && !allowedSpacerSizeSet.has(block.size)) {
    errors.push(`${path}: spacer size must be one of ${allowedSpacerSizes.join(", ")}`);
  }
  if (block.type === "link") {
    if (!block.href || typeof block.href !== "string") errors.push(`${path}: href is required`);
    else if (/^(?:javascript|data):/i.test(block.href)) errors.push(`${path}: unsafe href protocol`);
    if (typeof block.newTab !== "boolean") errors.push(`${path}: newTab must be a boolean`);
  }
  if (block.type === "embed") {
    // Freshly inserted via the "+" menu, an embed has no url yet - the
    // editor shows a placeholder until one is set in the block settings
    // panel, so an empty string has to stay valid or every fresh insert
    // would fail validation before the author gets to fill it in.
    if (typeof block.url !== "string") errors.push(`${path}: url must be a string`);
    else if (block.url && /^(?:javascript|data):/i.test(block.url)) errors.push(`${path}: unsafe url protocol`);
    if (block.aspectRatio !== undefined && typeof block.aspectRatio !== "number") {
      errors.push(`${path}: aspectRatio must be a number when provided`);
    }
  }
  if (["image", "video"].includes(block.type)) {
    validateAssetReference(block, "assetId", block.type, path, errors, assets);
    if (!allowedLayoutSet.has(block.layout)) {
      errors.push(`${path}: layout must be one of ${allowedLayouts.join(", ")}`);
    }
    if (block.caption !== undefined && block.caption !== null && typeof block.caption !== "string") {
      errors.push(`${path}: caption must be a string or null`);
    }
    if (block.frame !== undefined && typeof block.frame !== "boolean") {
      errors.push(`${path}: frame must be a boolean`);
    }
    if (block.frameBackgroundAssetId) {
      validateAssetReference(block, "frameBackgroundAssetId", "image", path, errors, assets);
    }
    for (const field of ["framePaddingTop", "framePaddingBottom", "framePaddingLeft", "framePaddingRight"]) {
      if (block[field] !== undefined && typeof block[field] !== "boolean") {
        errors.push(`${path}: ${field} must be a boolean`);
      }
    }
  }
  if (block.type === "image" && typeof block.alt !== "string") {
    errors.push(`${path}: alt must be a string`);
  }
  if (block.type === "video") {
    if (block.posterAssetId) {
      validateAssetReference(block, "posterAssetId", "image", path, errors, assets);
    }
    if (!isObject(block.playback)) errors.push(`${path}: playback is required`);
    else
      for (const option of ["controls", "autoplay", "muted", "loop"]) {
        if (typeof block.playback[option] !== "boolean") {
          errors.push(`${path}: playback.${option} must be a boolean`);
        }
      }
  }
  if (block.type === "codeBlock") {
    if (typeof block.code !== "string") {
      errors.push(`${path}: code must be a string`);
    }
    if (!codeLanguageValueSet.has(block.language)) {
      errors.push(`${path}: language must be one of ${codeLanguageValues.join(", ")}`);
    }
  }

  const children = validateChildren(block, path, errors);
  validateSectionStructure(block, children, path, errors);
  for (const [index, child] of children.entries()) {
    const childPath = `${path}.children[${index}]`;
    validateChildType(block, child, childPath, errors);
    validateBlock(child, childPath, errors, ids, assets);
  }
}

function validatePageData(document, errors, assets) {
  for (const key of ["bodyClass", "bodyStyle", "styles"]) {
    if (typeof document?.pageMeta?.[key] !== "string") {
      errors.push(`pageMeta.${key} must be a string`);
    }
  }
  if (!isObject(document?.hero)) errors.push("hero is required");
  else {
    if (typeof document.hero.eyebrow !== "string") errors.push("hero.eyebrow must be a string");
    validateAssetReference(document.hero, "coverAssetId", "image", "hero", errors, assets);
  }
  if (!Array.isArray(document?.relatedProjects)) errors.push("relatedProjects must be an array");
  else {
    const relatedSlugs = new Set();
    for (const [index, project] of document.relatedProjects.entries()) {
      const path = `relatedProjects[${index}]`;
      if (!project?.id || !project?.slug || !project?.title || typeof project.category !== "string") {
        errors.push(`${path}: id, slug, title, and category are required`);
      }
      if (relatedSlugs.has(project?.slug)) errors.push(`${path}: duplicate slug '${project.slug}'`);
      relatedSlugs.add(project?.slug);
      validateAssetReference(project, "thumbnailAssetId", "image", path, errors, assets);
    }
  }
}

export function validateProjectDocument(document) {
  const errors = [];
  if (!isObject(document)) return { valid: false, errors: ["document must be an object"] };

  if (document.schemaVersion !== projectDocumentVersion) {
    errors.push(`schemaVersion must be ${projectDocumentVersion}`);
  }
  for (const key of ["projectId", "slug", "title"]) {
    if (!document[key] || typeof document[key] !== "string") errors.push(`${key} is required`);
  }
  if (typeof document.excerpt !== "string") errors.push("excerpt must be a string");
  if (!isObject(document.theme)) errors.push("theme must be an object");
  else {
    const allowedThemeKeys = new Set([
      "accentColor",
      "mainBackgroundColor",
      "mainForegroundColor",
      "accentActiveColor",
      "subBackgroundColor",
      "subForegroundColor",
    ]);
    for (const [key, value] of Object.entries(document.theme)) {
      if (!allowedThemeKeys.has(key)) errors.push(`theme.${key} is not supported`);
      if (typeof value !== "string" || !value.trim()) {
        errors.push(`theme.${key} must be a string`);
      }
    }
  }
  if (document.contentWidth !== undefined && !["large", "medium", "small"].includes(document.contentWidth)) {
    errors.push("contentWidth must be large, medium, or small");
  }
  if (!Array.isArray(document.meta)) errors.push("meta must be an array");
  else {
    const metaIds = new Set();
    for (const [index, item] of document.meta.entries()) {
      if (!item?.id || typeof item.label !== "string" || typeof item.value !== "string") {
        errors.push(`meta[${index}]: id, label, and value are required`);
      }
      if (metaIds.has(item?.id)) errors.push(`meta[${index}]: duplicate id '${item.id}'`);
      metaIds.add(item?.id);
    }
  }
  if (!Number.isInteger(document.version) || document.version < 1) {
    errors.push("version must be a positive integer");
  }
  if (!Array.isArray(document.blocks)) errors.push("blocks must be an array");
  if (!Array.isArray(document.assets)) errors.push("assets must be an array");

  const assets = new Map();
  for (const [index, asset] of (document.assets ?? []).entries()) {
    const path = `assets[${index}]`;
    if (!isObject(asset) || !asset.id || typeof asset.id !== "string") {
      errors.push(`${path}: id is required`);
      continue;
    }
    if (assets.has(asset.id)) errors.push(`${path}: duplicate id '${asset.id}'`);
    assets.set(asset.id, asset);
    if (!assetKindSet.has(asset.kind)) errors.push(`${path}: unsupported kind '${asset.kind}'`);
    if (!assetProviderSet.has(asset.provider)) errors.push(`${path}: unsupported provider '${asset.provider}'`);
    if (!asset.src || typeof asset.src !== "string") errors.push(`${path}: src is required`);
  }

  validatePageData(document, errors, assets);
  const blockIds = new Set();
  for (const [index, block] of (document.blocks ?? []).entries()) {
    if (block?.type && !rootTypes.has(block.type)) {
      errors.push(`blocks[${index}]: '${block.type}' is not allowed at document root`);
    }
    validateBlock(block, `blocks[${index}]`, errors, blockIds, assets);
  }
  return { valid: errors.length === 0, errors };
}

export function assertProjectDocument(document) {
  const result = validateProjectDocument(document);
  if (!result.valid) throw new Error(`Invalid project document:\n${result.errors.join("\n")}`);
  return document;
}
