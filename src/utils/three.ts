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
import { DRACOLoader, GLTFLoader } from 'three-stdlib';

// Enable caching for all loaders
Cache.enabled = true;

const dracoLoader = new DRACOLoader();
const gltfLoader = new GLTFLoader();
dracoLoader.setDecoderPath('/draco/');
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * GLTF model loader configured with draco decoder
 */
export const modelLoader: GLTFLoader = gltfLoader;
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
      const texture = value as { dispose: () => void; source?: { data?: { close?: () => void } } };
      texture.dispose();

      // Close GLTF bitmap textures
      texture.source?.data?.close?.();
    }
  }
};

/**
 * Clean up and dispose of a renderer
 */
export const cleanRenderer = (renderer: WebGLRenderer): void => {
  renderer.dispose();
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
