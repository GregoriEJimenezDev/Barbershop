import { Component } from 'react';

/**
 * ErrorBoundary - Catches any render-time errors and shows a fallback UI
 * instead of a blank page. Particularly important for Firebase init failures.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App error boundary caught:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If the error was in Firebase, still try to show the landing
      return this.props.fallback ? this.props.fallback(this.state.error, this.reset) : null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
