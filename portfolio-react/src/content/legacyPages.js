import homeHtml from "../../../index.html?raw";
import aboutHtml from "../../../about/index.html?raw";

const projectFiles = import.meta.glob(
  [
    "../../../work/*/index.html",
    "!../../../work/1min-return/index.html",
    "!../../../work/bznav-sans/index.html",
  ],
  {
    query: "?raw",
    import: "default",
  },
);

export const pages = {
  home: homeHtml,
  about: aboutHtml,
};

const projectLoaders = Object.fromEntries(
  Object.entries(projectFiles).map(([path, load]) => {
    const slug = path.match(/work\/([^/]+)\/index\.html$/)?.[1];
    return [slug, load];
  }),
);

export async function loadLegacyProject(slug) {
  return projectLoaders[slug]?.() ?? null;
}

export function getDocumentMeta(html) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const styles = document.querySelector("style")?.textContent ?? "";
  const title =
    document.querySelector("title")?.textContent ?? "Youngsam's Projects";
  const bodyClass = document.body.className;
  const bodyStyle = document.body.getAttribute("style") ?? "";

  return { bodyClass, bodyStyle, styles, title };
}

export function getHomeProjectSlugs() {
  const document = new DOMParser().parseFromString(pages.home, "text/html");
  return new Set(
    [...document.querySelectorAll('.work a[href*="/work/"]')]
      .map((anchor) => anchor.getAttribute("href")?.match(/work\/([^/]+)/)?.[1])
      .filter(Boolean),
  );
}

export function getPageContent(
  html,
  type,
  slug = "",
  { excludeProjectContent = false } = {},
) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const container = document.querySelector(".container");

  if (!container) return "";

  container.querySelector("header")?.remove();
  container.querySelector(".mobile_nav")?.remove();
  container.querySelector("footer")?.remove();

  if (type === "project" && excludeProjectContent) {
    container.querySelector(".contents")?.remove();
  }

  const base = import.meta.env.BASE_URL;
  const pageDirectory =
    type === "project"
      ? `${base}work/${slug}/`
      : type === "about"
        ? `${base}about/`
        : base;

  const normalizeUrl = (value) => {
    if (!value || /^(?:[a-z]+:|#|\/\/)/i.test(value)) return value;
    const cssUrl = value.match(/^url\(['"]?(.+?)['"]?\)$/i);
    const rawValue = cssUrl?.[1] ?? value;
    return new URL(rawValue, `${window.location.origin}${pageDirectory}`)
      .pathname;
  };

  container
    .querySelectorAll("[src], [poster], [data-url]")
    .forEach((element) => {
      ["src", "poster", "data-url"].forEach((attribute) => {
        if (element.hasAttribute(attribute)) {
          element.setAttribute(
            attribute,
            normalizeUrl(element.getAttribute(attribute)),
          );
        }
      });
    });

  container.querySelectorAll("a[href]").forEach((anchor) => {
    anchor.setAttribute("href", normalizeUrl(anchor.getAttribute("href")));
  });

  if (type === "project") {
    return container.innerHTML;
  }

  return container.innerHTML;
}
