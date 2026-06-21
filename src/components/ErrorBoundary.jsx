import React from 'react';

/**
 * React class-based Error Boundary.
 * Catches rendering errors anywhere in the child component tree and displays
 * a recovery UI instead of crashing the whole application.
 *
 * @extends {React.Component}
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    /** @type {{ hasError: boolean, error: Error|null }} */
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state to show fallback UI when an error is caught.
   * @param {Error} error
   * @returns {{ hasError: boolean, error: Error }}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state" role="alert">
          <div className="empty-state__icon">⚠️</div>
          <h2 className="empty-state__title">Something went wrong</h2>
          <p className="empty-state__description">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn--primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
