import LegacyContent from "../components/content/LegacyContent";
import SiteLayout from "../components/layout/SiteLayout";
import PublishedProjectList from "../components/project/PublishedProjectList";
import {
  getDocumentMeta,
  getHomeProjectSlugs,
  getPageContent,
  pages,
} from "../content/legacyPages";

export default function HomePage() {
  const meta = getDocumentMeta(pages.home);
  const content = getPageContent(pages.home, "home");

  return (
    <SiteLayout meta={meta}>
      <LegacyContent html={content} />
      <PublishedProjectList excludeSlugs={getHomeProjectSlugs()} />
    </SiteLayout>
  );
}
