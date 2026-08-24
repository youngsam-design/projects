import LegacyContent from "../components/content/LegacyContent";
import SiteLayout from "../components/layout/SiteLayout";
import { getDocumentMeta, getPageContent, pages } from "../content/legacyPages";

export default function AboutPage() {
  const meta = getDocumentMeta(pages.about);
  const content = getPageContent(pages.about, "about");

  return (
    <SiteLayout meta={meta}>
      <LegacyContent html={content} />
    </SiteLayout>
  );
}
