import { Component, type ErrorInfo, type ReactNode } from "react";
import AdminErrorState from "./AdminErrorState";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error("Admin boundary", error, info);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) return <AdminErrorState onRetry={this.reset} />;
    return this.props.children;
  }
}
