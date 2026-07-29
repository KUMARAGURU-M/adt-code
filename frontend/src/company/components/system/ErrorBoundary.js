import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[Arrow Data Tech] Unhandled render error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main id="main-content" className="system-state" tabIndex="-1">
          <div className="system-state__card">
            <p className="system-state__eyebrow">Something went wrong</p>
            <h1>We could not load this page.</h1>
            <p>Refresh the page. If the problem continues, contact Arrow Data Tech and mention the page you were opening.</p>
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
