import { cleanRenderer, mountRenderer } from './three';

// jsdom has no WebGL, so the real constructor throws. This stand-in mirrors the
// one behaviour these tests turn on: a renderer uses the canvas it was handed,
// or makes one and owns it.
jest.mock('three', () => {
  const three = jest.requireActual('three');

  class MockWebGLRenderer {
    domElement: HTMLCanvasElement;
    dispose = jest.fn();
    forceContextLoss = jest.fn();

    constructor(parameters?: { canvas?: HTMLCanvasElement }) {
      this.domElement = parameters?.canvas ?? document.createElement('canvas');
    }
  }

  return { ...three, WebGLRenderer: MockWebGLRenderer };
});

describe('mountRenderer', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('mounts a canvas of its own into the container', () => {
    const renderer = mountRenderer(container, { className: 'canvas' });

    expect(container.querySelector('canvas')).toBe(renderer.domElement);
    expect(renderer.domElement.className).toBe('canvas');
  });

  it('gives every renderer its own canvas', () => {
    // The whole point of the renderer owning its element. A canvas whose context
    // has been lost can never hand out another one, so a second renderer built
    // on a torn-down renderer's canvas would come back with a null context —
    // which is exactly what a JSX-rendered canvas, reused across StrictMode's
    // double-invoked effect, used to produce.
    const first = mountRenderer(container);
    const second = mountRenderer(container);

    expect(second.domElement).not.toBe(first.domElement);
  });
});

describe('cleanRenderer', () => {
  it('releases the WebGL context and removes the canvas', () => {
    // `dispose()` alone frees three's GPU objects but leaves the context alive
    // until the canvas is collected. Browsers cap live contexts and evict the
    // oldest, so holding one past teardown eventually kills an unrelated,
    // still-visible canvas elsewhere on the page.
    const container = document.createElement('div');
    document.body.append(container);
    const renderer = mountRenderer(container);
    const { domElement } = renderer;

    cleanRenderer(renderer);

    expect(renderer.dispose).toHaveBeenCalled();
    expect(renderer.forceContextLoss).toHaveBeenCalled();
    expect(domElement.isConnected).toBe(false);
  });
});
