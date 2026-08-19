import { render, screen } from '@testing-library/react';
import { Resume } from './Resume';

// Meta reads the router (to build a per-page og:url), and this is a unit
// test rendered outside the app shell that normally provides one — mirror
// the same next-router-mock swap tests/integration/setup.ts uses.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('next/router', () => require('next-router-mock'));

// Resume decides mobile vs. desktop via `window.matchMedia`, which jsdom
// doesn't implement by default in the unit-test environment (only
// tests/integration/setup.ts stubs it globally). Mock it here, driven by a
// simple "current width" so each test can pick a viewport.
function mockMatchMedia(width: number) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => {
    const maxWidth = Number(query.match(/max-width:\s*(\d+)px/)?.[1]);
    return {
      matches: width <= maxWidth,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  });
}

// The PDF embed is deliberately client-only, so these assertions cover the
// post-hydration render that a server-rendered snapshot would not show.
describe('Resume', () => {
  it('always renders the download and open-in-new-tab actions', () => {
    mockMatchMedia(1280);
    render(<Resume />);
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
    expect(screen.getByText('Open in new tab')).toBeInTheDocument();
  });

  it('renders the PDF viewer once mounted on a desktop viewport', () => {
    mockMatchMedia(1280);
    render(<Resume />);
    expect(screen.getByTitle('Resume PDF')).toBeInTheDocument();
  });

  it('renders the mobile fallback instead of the viewer on small viewports', () => {
    mockMatchMedia(375);
    render(<Resume />);
    expect(screen.queryByTitle('Resume PDF')).not.toBeInTheDocument();
    expect(screen.getByText(/PDF preview isn't available on mobile/)).toBeInTheDocument();
  });
});
