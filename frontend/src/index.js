import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Error boundary to catch and handle DOM-related errors gracefully
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log DOM-related errors but don't crash
    if (error.name === 'NotFoundError' && error.message.includes('insertBefore')) {
      console.warn('DOM reconciliation error caught and handled:', error.message);
      // Attempt recovery by forcing re-render
      this.setState({ hasError: false, error: null });
    } else {
      console.error('Application error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error?.name !== 'NotFoundError') {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Algo salió mal</h2>
          <button onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Create root and render
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the app
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

// Signal that React is ready and load external scripts
window.__REACT_READY__ = true;

// Load external scripts after React is mounted (with a small delay for safety)
setTimeout(() => {
  if (typeof window.__loadExternalScripts === 'function') {
    window.__loadExternalScripts();
  }
}, 100);
