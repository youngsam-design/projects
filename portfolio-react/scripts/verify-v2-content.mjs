import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateProjectDocument } from "../src/content/schema/validateProjectDocument.js";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const contentRoot = path.join(appRoot, "src/content/projects-v2");
const files = (await readdir(contentRoot)).filter((file) =>
  file.endsWith(".json"),
);
let hasErrors = false;

function findBlock(blocks, predicate) {
  for (const block of blocks) {
    if (predicate(block)) return block;
    const child = findBlock(block.children ?? [], predicate);
    if (child) return child;
  }
  return null;
}

function expectInvalid(document, label, mutate, expectedMessage) {
  const invalidDocument = structuredClone(document);
  mutate(invalidDocument);
  const result = validateProjectDocument(invalidDocument);

  if (
    result.valid ||
    !result.errors.some((error) => error.includes(expectedMessage))
  ) {
    hasErrors = true;
    console.error(
      `${label}: validator did not reject the invalid document as expected`,
    );
  }
}

for (const file of files) {
  const document = JSON.parse(
    await readFile(path.join(contentRoot, file), "utf8"),
  );
  const result = validateProjectDocument(document);

  if (!result.valid) {
    hasErrors = true;
    console.error(`${file}:\n${result.errors.join("\n")}`);
    continue;
  }

  for (const asset of document.assets) {
    if (asset.provider !== "local") continue;

    const assetPath = path.resolve(
      appRoot,
      "public/work",
      document.slug,
      asset.src,
    );

    try {
      await access(assetPath);
    } catch {
      hasErrors = true;
      console.error(`${file}: missing local asset '${asset.src}'`);
    }
  }

  expectInvalid(
    document,
    `${file} invalid heading`,
    (draft) => {
      findBlock(draft.blocks, (block) => block.type === "heading").level = 9;
    },
    "heading level",
  );
  expectInvalid(
    document,
    `${file} unsafe link`,
    (draft) => {
      const paragraph = findBlock(
        draft.blocks,
        (block) => block.type === "paragraph",
      );
      paragraph.children.push({
        id: "invalid-link",
        type: "link",
        href: "javascript:alert(1)",
        newTab: false,
        children: [
          { id: "invalid-link-text", type: "text", text: "bad", marks: [] },
        ],
      });
    },
    "unsafe href protocol",
  );
  expectInvalid(
    document,
    `${file} invalid video asset`,
    (draft) => {
      const video = findBlock(draft.blocks, (block) => block.type === "video");
      video.assetId = draft.assets.find((asset) => asset.kind === "image").id;
    },
    "must reference a video asset",
  );
  expectInvalid(
    document,
    `${file} invalid variant`,
    (draft) => {
      draft.blocks
        .find((block) => block.type === "section")
        .variant.push("unknown");
    },
    "unsupported variant",
  );
  expectInvalid(
    document,
    `${file} missing content section`,
    (draft) => {
      const section = draft.blocks.find(
        (block) =>
          block.type === "section" && block.variant?.includes("content"),
      );
      section.children = section.children.filter(
        (child) => !child.variant?.includes("contentSection"),
      );
    },
    "exactly one contentSection",
  );
  expectInvalid(
    document,
    `${file} duplicate content section`,
    (draft) => {
      const section = draft.blocks.find(
        (block) =>
          block.type === "section" && block.variant?.includes("content"),
      );
      const contentSection = section.children.find((child) =>
        child.variant?.includes("contentSection"),
      );
      section.children.push(structuredClone(contentSection));
    },
    "exactly one contentSection",
  );
  expectInvalid(
    document,
    `${file} unsafe embed url`,
    (draft) => {
      draft.blocks.push({
        id: "invalid-embed",
        type: "embed",
        url: "javascript:alert(1)",
        variant: [],
      });
    },
    "unsafe url protocol",
  );
  expectInvalid(
    document,
    `${file} table row with a non-cell child`,
    (draft) => {
      draft.blocks.push({
        id: "invalid-table",
        type: "table",
        variant: [],
        children: [
          {
            id: "invalid-table-row",
            type: "tableRow",
            variant: [],
            children: [
              {
                id: "invalid-table-child",
                type: "paragraph",
                variant: [],
                children: [
                  { id: "invalid-table-text", type: "text", text: "bad", marks: [] },
                ],
              },
            ],
          },
        ],
      });
    },
    "tableRow can only contain tableCell blocks",
  );

  console.log(
    `${file}: ${document.blocks.length} blocks, ${document.assets.length} assets`,
  );
}

if (hasErrors) process.exitCode = 1;
