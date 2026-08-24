import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Header.scss";
import styles from "./Header.module.scss";

export default function Header({ isProject }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const slider = document.getElementById("slider");
      const stickyThreshold = isProject ? (slider?.offsetHeight ?? window.innerHeight) : 64;

      setScrolled(window.scrollY > stickyThreshold);

      if (progressRef.current) {
        // 100% should land at the end of the actual case-study content, not
        // after also scrolling through the "Other Works" carousel (and the
        // global footer that follows it) - so measure up to where .project
        // starts instead of the whole document's height.
        const relatedProjects = document.querySelector("#contents > .project");
        const contentBottom = relatedProjects
          ? relatedProjects.getBoundingClientRect().top + window.scrollY
          : document.documentElement.scrollHeight;
        const scrollableHeight = contentBottom - window.innerHeight;
        const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
        progressRef.current.style.width = `${Math.min(progress, 100)}%`;
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isProject]);

  useEffect(() => {
    document.body.classList.toggle("nav", menuOpen);
    document.body.classList.toggle("nonav", !menuOpen);
    return () => document.body.classList.remove("nav");
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const headerClassName = isProject
    ? "sticky focusout"
    : scrolled
      ? "sticky focusout"
      : "";

  return (
    <>
      <header className={headerClassName}>
        <nav>
          <NavLink to="/" className="logo hover-target" onClick={closeMenu}>
            <h1>Youngsam</h1>
          </NavLink>
          <ul>
            <li><NavLink className="hover-target" to="/">WORK</NavLink></li>
            <li><NavLink className="hover-target" to="/about">ABOUT</NavLink></li>
          </ul>
          <button
            className="burger"
            type="button"
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <rect y="7" width="24" height="2" />
              <rect y="15" width="24" height="2" />
            </svg>
          </button>
        </nav>
        {isProject && (
          <div className={`progress-container ${scrolled ? "up" : ""}`} id="pgWrap" aria-hidden="true">
            <div ref={progressRef} className="progress-bar" id="pgBar" />
          </div>
        )}
      </header>
      <div className={`mobile_nav ${styles.mobileNav}`} aria-hidden={!menuOpen}>
        <div>
          <ul className="primary">
            <li><NavLink to="/" onClick={closeMenu}>WORK</NavLink></li>
            <li><NavLink to="/about" onClick={closeMenu}>ABOUT</NavLink></li>
          </ul>
        </div>
      </div>
    </>
  );
}
