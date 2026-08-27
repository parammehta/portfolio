/**
 * The plugin runs at build time in Node — jsdom has no TextDecoder, which
 * image-size needs.
 *
 * @jest-environment node
 */
import { rehypeImgSize } from 'utils/rehypeImgSize';

const img = (src: string) => ({ type: 'element', tagName: 'img', properties: { src } });

const tree = (...children: unknown[]) => ({
  type: 'root',
  children: [{ type: 'element', tagName: 'p', children }],
}) as never;

describe('rehypeImgSize', () => {
  it('stamps intrinsic dimensions on local images', () => {
    const node = img('/static/inspiration.png');

    rehypeImgSize({ dir: 'public' })(tree(node));

    expect(node.properties).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
  });

  it('leaves remote images alone', () => {
    const node = img('https://example.com/banner.png');

    rehypeImgSize({ dir: 'public' })(tree(node));

    expect(node.properties).toEqual({ src: 'https://example.com/banner.png' });
  });

  it('throws with the path when the image is missing', () => {
    expect(() => rehypeImgSize({ dir: 'public' })(tree(img('/static/nope.png')))).toThrow(
      /could not read image "public\/static\/nope\.png"/
    );
  });
});
