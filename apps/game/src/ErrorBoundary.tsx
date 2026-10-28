import { Component, type ReactNode } from 'react';

/**
 * A WebGL failure (context cap, GPU blocklist, out of memory) used to unmount the whole tree and
 * leave a blank dark page. This keeps a way out on screen.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error('Campaign Run crashed', error);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="cr-screen cr-screen--loading" role="alert">
        <div className="cr-loading">
          <p className="cr-kicker">Something broke on the road</p>
          <p className="cr-fineprint">Your progress is saved on this phone. Reload to carry on.</p>
          <button className="cr-btn" type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
