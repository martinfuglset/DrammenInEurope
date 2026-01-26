import { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : 'Ukjent feil';
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
          <div className="max-w-lg w-full bg-white/70 border border-royal/10 shadow-sm p-6 space-y-3">
            <h1 className="font-display font-bold text-xl text-royal uppercase">Noe gikk galt</h1>
            <p className="text-royal/70 text-sm">
              Det oppstod en feil i appen. Oppdater siden og prøv igjen.
            </p>
            {this.state.message && (
              <p className="text-red-500 text-xs font-mono uppercase break-words">
                {this.state.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
