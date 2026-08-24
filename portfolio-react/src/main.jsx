import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./foundation/color/color.css";
import "./foundation/radius/radius.css";
import "./foundation/spacing/spacing.scss";
import "./foundation/layout/layout.scss";
import "./foundation/elevation/elevation.css";
import "./foundation/typography/typography.scss";
import "./foundation/easing/motion.css";
import "./foundation/effect/effect.css";
import "./styles/main.scss";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
