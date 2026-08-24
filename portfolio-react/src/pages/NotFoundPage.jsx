import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <p>404</p>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <Link to="/">프로젝트로 돌아가기</Link>
    </main>
  );
}
