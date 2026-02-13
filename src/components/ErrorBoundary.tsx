import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 items-center justify-center bg-tn-bg text-tn-text">
          <div className="text-center space-y-4 max-w-md px-4">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-tn-text-secondary break-words">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded bg-tn-accent text-white text-sm hover:opacity-90"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
