import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import { getCodeLanguageLabel, getPrismLanguage } from "../../../content/schema/codeLanguages";
import "./CodeBlock.scss";

export default function CodeBlock({ block, gridProps = {} }) {
  const codeRef = useRef(null);
  const prismLanguage = getPrismLanguage(block.language);

  useEffect(() => {
    if (codeRef.current) Prism.highlightElement(codeRef.current);
  }, [block.code, prismLanguage]);

  return (
    <div
      className={["project-code-block", gridProps.className].filter(Boolean).join(" ")}
      data-block-type="codeBlock"
      style={gridProps.style}
    >
      <div className="project-code-block-label">{getCodeLanguageLabel(block.language)}</div>
      <pre className={`language-${prismLanguage}`}>
        <code className={`language-${prismLanguage}`} ref={codeRef}>
          {block.code}
        </code>
      </pre>
    </div>
  );
}
