import { useEffect } from "react";
import Footer from "./Footer";
import Header from "./Header";
import "./SiteLayout.scss";

const themeVariables = {
  mainColor: "--theme-accent",
  backgroundColor: "--theme-background",
  textColor: "--theme-foreground",
  accentActiveColor: "--theme-accent-active",
  menuColor: "--menu-color",
};

export default function SiteLayout({
  children,
  meta,
  theme = {},
  isProject = false,
}) {
  useEffect(() => {
    const previousThemeValues = Object.fromEntries(
      Object.values(themeVariables).map((variable) => [
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
