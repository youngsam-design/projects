import { Navigate, Route, Routes } from "react-router-dom";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import ProjectPage from "./pages/ProjectPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import ProjectEditorDashboard from "./pages/ProjectEditorDashboard";
import { Cursor } from "./components/effects/Cursor";
import ScrollToTop from "./components/effects/ScrollToTop";

export default function App() {
  return (
    <>
      <Cursor />
      <ScrollToTop />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="work/:slug" element={<ProjectPage />} />
        <Route path="editor" element={<ProjectEditorDashboard />} />
        <Route path="editor/:slug" element={<ProjectEditorPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
}
