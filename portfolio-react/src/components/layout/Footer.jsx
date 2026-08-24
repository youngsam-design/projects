import "./Footer.scss";

export default function Footer() {
  return (
    <footer>
      <div className="footer-wrap">
        <div className="copyright">Copyright © {new Date().getFullYear()}</div>
        <div className="description">
          <ul>
            <li>
              <p>Designed and developed by <span className="mylogo">Youngsam</span></p>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
