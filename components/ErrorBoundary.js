// components/ErrorBoundary.js — Global error boundary with retry
import React from 'react';
import { Button } from './UIDesignSystem';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        // This screen was the one surface still using raw Tailwind defaults —
        // bg-gray-50, bg-red-100, text-gray-900 — so the global error state of
        // a dark product rendered as a light grey page with a red medallion.
        // It now looks like the rest of the portal, which matters most here:
        // the moment something breaks is the worst moment to look unfamiliar.
        <div className="min-h-screen bg-ftm-night flex items-center px-6">
          <div className="w-full max-w-shell mx-auto">
            <div className="max-w-measure border-l-[6px] border-ftm-crimson pl-6 py-2" role="alert">
              <h1 className="font-grotesk font-bold text-[28px] text-ftm-ink mb-3">
                Something went wrong
              </h1>
              <p className="font-inter text-[16px] leading-relaxed text-ftm-mut mb-2">
                The page stopped working. Nothing you have already submitted is affected.
              </p>
              <p className="font-inter text-[16px] leading-relaxed text-ftm-mut mb-7">
                Try again. If you are mid-exam, tell an invigilator now rather than reloading.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Button variant="primary" onClick={this.handleRetry}>Try again</Button>
                <Button variant="ghost" onClick={() => window.location.href = '/login'}>
                  Go to sign-in
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
