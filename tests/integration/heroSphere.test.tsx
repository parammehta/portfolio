import { StrictMode } from 'react';
import { screen } from '@testing-library/react';
import { HeroSphere } from 'pages/home/HeroSphere';
import { renderPage } from './renderPage';
import { mockReleasedCanvases } from './setup';

// A WebGL context is a scarce, browser-wide resource: they are capped (~16 in
// Chrome) and the *oldest* is evicted once that cap is passed. The hero sphere
// is the first canvas on the page, so it is always the oldest — holding contexts
// past teardown anywhere on the site is what left it dead with the browser's
// broken-image glyph painted over it after scrolling the experience timeline.
// These cover both halves of getting that right against a real mount/unmount:
// release what is gone, keep what is on screen.
describe('hero sphere renderer lifecycle', () => {
  beforeEach(() => {
    mockReleasedCanvases.length = 0;
  });

  it('releases its WebGL context and removes its canvas when it unmounts', async () => {
    const { unmount } = renderPage(() => <HeroSphere data-testid="hero-sphere" />);

    const canvas = (await screen.findByTestId('hero-sphere')).querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    unmount();

    expect(mockReleasedCanvases).toContain(canvas);
    expect(canvas!.isConnected).toBe(false);
  });

  it('leaves a live canvas behind after StrictMode remounts it', async () => {
    // StrictMode runs the effect, tears it down, and runs it again. The renderer
    // owns its canvas, so the second run builds a fresh one — which is what lets
    // teardown release the context unconditionally. What must hold either way is
    // that exactly one canvas is left and its context is intact: a canvas whose
    // context has been lost can never hand out another one, and three throws on
    // the null context that comes back.
    renderPage(() => (
      <StrictMode>
        <HeroSphere data-testid="hero-sphere" />
      </StrictMode>
    ));

    const canvases = (await screen.findByTestId('hero-sphere')).querySelectorAll('canvas');

    expect(canvases).toHaveLength(1);
    expect(mockReleasedCanvases).not.toContain(canvases[0]);
  });
});
