import { useEffect } from "react";
import Footer from "./Footer";
import Header from "./Header";
import "./SiteLayout.scss";

// `accentColor` is intentionally excluded here - it's optional (see
// ProjectSettingsEditor's "Accent Color 사용" checkbox), and when unset the
// header nav should read as mainForegroundColor instead, so it's resolved
// separately below rather than just skipped when absent.
const themeVariables = {
  mainBackgroundColor: "--theme-background",
  mainForegroundColor: "--theme-foreground",
  accentActiveColor: "--theme-accent-active",
  subBackgroundColor: "--group-background",
  subForegroundColor: "--group-foreground",
};
const accentVariable = "--theme-accent";

export default function SiteLayout({
  children,
  meta,
  theme = {},
  isProject = false,
}) {
  useEffect(() => {
    const trackedVariables = [...Object.values(themeVariables), accentVariable];
    const previousThemeValues = Object.fromEntries(
      trackedVariables.map((variable) => [
        variable,
        document.documentElement.style.getPropertyValue(variable),
      ]),
    );

    document.title = meta.title;
    document.body.className = `${meta.bodyClass} nonav`;
    document.body.setAttribute("style", meta.bodyStyle);
    for (const [key, value] of Object.entries(theme)) {
      const variable = themeVariables[key];
      if (variable && value)
        document.documentElement.style.setProperty(variable, value);
    }
    const accentColor = theme.accentColor || theme.mainForegroundColor;
    if (accentColor) document.documentElement.style.setProperty(accentVariable, accentColor);

    return () => {
      document.body.className = "";
      document.body.removeAttribute("style");
      for (const [variable, value] of Object.entries(previousThemeValues)) {
        if (value) document.documentElement.style.setProperty(variable, value);
        else document.documentElement.style.removeProperty(variable);
      }
    };
  }, [meta, theme]);

  return (
    <>
      {meta.styles && <style>{meta.styles}</style>}
      <Header isProject={isProject} />
      {children}
      <Footer />
    </>
  );
}
