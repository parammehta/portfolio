import fs from 'fs';
import path from 'path';
import { disableTypes, imageSize } from 'image-size';

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface RehypeImgSizeOptions {
  /** Directory local `src` paths are resolved against, relative to cwd (e.g. `public`) */
  dir?: string;
}

// The ICNS, JXL and HEIF parsers can spin forever on malformed input
// (GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq) and there is no fixed release.
// Posts only ever embed raster web formats, so the vulnerable detectors are
// switched off outright rather than left reachable.
disableTypes(['icns', 'heif', 'jxl', 'jxl-stream']);

/**
 * Handles `//`, `http://`, `https://`, `ftp://`
 */
const absoluteUrl = /^(?:[a-z]+:)?\/\//i;

/**
 * Rehype plugin that stamps intrinsic `width`/`height` on `<img>` tags pointing
 * at local files, so the browser can reserve space before the image loads.
 *
 * This replaces the unmaintained `rehype-img-size`, which pinned `image-size` v1
 * and had no upgrade path off it.
 */
export function rehypeImgSize({ dir }: RehypeImgSizeOptions = {}) {
  return function transformer(tree: HastNode) {
    visitImages(tree, node => {
      const src = node.properties?.src;

      if (typeof src !== 'string' || absoluteUrl.test(src)) return;

      // Treat `/` as a relative path, according to the server
      const shouldJoin = !path.isAbsolute(src) || src.startsWith('/');
      const filePath = dir && shouldJoin ? path.join(dir, src) : src;

      const { width, height } = readImageSize(filePath);

      node.properties!.width = width;
      node.properties!.height = height;
    });
  };
}

function readImageSize(filePath: string) {
  try {
    return imageSize(fs.readFileSync(filePath));
  } catch (error) {
    throw new Error(`rehypeImgSize: could not read image "${filePath}"`, { cause: error });
  }
}

function visitImages(node: HastNode, visitor: (node: HastNode) => void) {
  if (node.type === 'element' && node.tagName === 'img') visitor(node);

  for (const child of node.children ?? []) {
    visitImages(child, visitor);
  }
}
