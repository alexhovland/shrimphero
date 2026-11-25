import { Component, type ReactNode } from 'react';

// Shows "fallback" instead of its children if they fail to load or render,
// so one broken part (for example the map library download) does not blank the page.
export class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
