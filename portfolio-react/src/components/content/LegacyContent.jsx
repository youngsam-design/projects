import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import parse from "html-react-parser";
import useProjectCarousel from "../../hooks/useProjectCarousel";
import "./LegacyContent.scss";

export default function LegacyContent({ html, enhance = true }) {
  const navigate = useNavigate();
  const content = useMemo(() => parse(html), [html]);
  useProjectCarousel(enhance ? html : null);

  useEffect(() => {
    if (!enhance) return undefined;

    document
      .querySelectorAll(".container .hidden")
      .forEach((element) => element.classList.remove("hidden"));

    document.querySelectorAll(".container [data-url]").forEach((element) => {
      element.style.backgroundImage = `url(${element.dataset.url})`;
    });

    document.querySelectorAll(".container video").forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
    });

    const handleClick = (event) => {
      if (event.defaultPrevented) return;
      const anchor = event.target.closest("a");
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      if (!url.pathname.startsWith(base)) return;

      event.preventDefault();
      const nextPath = url.pathname.slice(base.length) || "/";
      navigate(`${nextPath}${url.search}${url.hash}`);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [enhance, html, navigate]);

  return content;
}
