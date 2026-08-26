import {
  Cache,
  TextureLoader,
  Mesh,
  Material,
  Object3D,
  Light,
  WebGLRenderer,
  Scene,
} from 'three';
import type { WebGLRendererParameters } from 'three';
import { DRACOLoader, GLTFLoader } from 'three-stdlib';

// Enable caching for all loaders
Cache.enabled = true;

const gltfLoaders = new Map<string, GLTFLoader>();

/**
 * GLTF model loader configured with the draco decoder. Constructed lazily on
 * first use rather than at module scope, so importing this module has no
 * side effect. Cached per decoder path.
 */
export function getModelLoader(decoderPath = '/draco/'): GLTFLoader {
  let gltfLoader = gltfLoaders.get(decoderPath);

  if (!gltfLoader) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(decoderPath);
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoaders.set(decoderPath, gltfLoader);
  }

  return gltfLoader;
}

export const textureLoader: TextureLoader = new TextureLoader();

/**
 * Clean up a scene's materials and geometry
 */
export const cleanScene = (scene: Scene): void => {
  scene?.traverse(object => {
    if (!(object instanceof Mesh)) return;

    object.geometry.dispose();

    if (Array.isArray(object.material)) {
      for (const material of object.material) {
        cleanMaterial(material);
      }
    } else {
      cleanMaterial(object.material);
    }
  });
};

/**
 * Clean up and dispose of a material
 */
export const cleanMaterial = (material: Material): void => {
  material.dispose();

  const record = material as unknown as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    const value = record[key];
    if (
      value &&
      typeof value === 'object' &&
      'minFilter' in (value as Record<string, unknown>)
    ) {
      const texture = value as {
        dispose: () => void;
        source?: { data?: { close?: () => void } };
      };
      texture.dispose();

      // Close GLTF bitmap textures
      texture.source?.data?.close?.();
    }
  }
};

/**
 * Create a renderer that owns its canvas and mount it into `container`.
 *
 * The renderer has to make the canvas itself rather than being handed one that
 * React rendered. Those are two different lifetimes: a renderer lives and dies
 * with an effect, a JSX canvas lives and dies with the component's output, and
 * the two do not line up. StrictMode tears an effect down and re-runs it
 * against the element React is still holding, so a renderer that released its
 * context on teardown would leave the next run holding a canvas that can never
 * produce another one — three throws on the null context that comes back.
 *
 * When the renderer owns the element every run starts from a fresh canvas, and
 * `cleanRenderer` can hand the context back unconditionally.
 */
export const mountRenderer = (
  container: HTMLElement,
  { className, ...parameters }: WebGLRendererParameters & { className?: string } = {}
): WebGLRenderer => {
  const renderer = new WebGLRenderer(parameters);

  if (className) renderer.domElement.className = className;
  container.append(renderer.domElement);

  return renderer;
};

/**
 * Tear down a renderer created by `mountRenderer`, releasing its WebGL context
 * and removing its canvas.
 *
 * `dispose()` on its own frees three's GPU objects but leaves the context alive
 * until the canvas is garbage collected, which can be many seconds later.
 * Browsers cap live contexts (~16 in Chrome) and evict the *oldest* once that
 * cap is passed, so a component that mounts and unmounts a renderer as it
 * scrolls will eventually kill an unrelated, still-visible canvas elsewhere on
 * the page.
 */
export const cleanRenderer = (renderer: WebGLRenderer): void => {
  renderer.dispose();
  renderer.forceContextLoss();
  renderer.domElement.remove();
};

/**
 * Clean up lights by removing them from their parent
 */
export const removeLights = (lights: Light[]): void => {
  for (const light of lights) {
    light.parent?.remove(light);
  }
};

/**
 * Get child by name
 */
export const getChild = (name: string, object: Object3D): Object3D | undefined => {
  let node: Object3D | undefined;

  object.traverse(child => {
    if (child.name === name) {
      node = child;
    }
  });

  return node;
};
