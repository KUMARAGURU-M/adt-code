import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  return (
    <main id="main-content" className="not-found" tabIndex="-1">
      <div className="container not-found__inner">
        <p className="not-found__code" aria-hidden="true">404</p>
        <p className="not-found__eyebrow">Page not found</p>
        <h1>The link is broken or the page moved.</h1>
        <p>Use the main navigation or return to the homepage.</p>
        <div className="not-found__actions">
          <Link to="/" className="btn-primary">Return home</Link>
          <Link to="/contact" className="btn-ghost">Contact Arrow Data Tech</Link>
        </div>
      </div>
    </main>
  );
}

export default NotFound;
