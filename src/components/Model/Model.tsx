import { animate, useReducedMotion, useSpring } from 'framer-motion';
import { useInViewport } from 'hooks';
import { useFps } from 'hooks/useFps';
import {
  createRef,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, HTMLAttributes, RefObject } from 'react';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import type { Light, Texture } from 'three';
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib';
import { resolveSrcFromSrcSet } from 'utils/image';
import { classes, cssProps, numToMs } from 'utils/style';
import {
  cleanRenderer,
  cleanScene,
  getModelLoader,
  removeLights,
  textureLoader,
} from 'utils/three';
import styles from './Model.module.css';
import { ModelAnimationType } from './deviceModels';
import type { ModelAnimationTypeValue } from './deviceModels';

const MeshType = {
  Frame: 'Frame',
  Logo: 'Logo',
  Screen: 'Screen',
} as const;

const rotationSpringConfig = {
  stiffness: 40,
  damping: 20,
  mass: 1.4,
  restSpeed: 0.001,
};

interface ImageLike {
  src: string;
  width?: number;
  height?: number;
}

interface ModelTexture {
  placeholder: string | ImageLike;
  srcSet?: (string | ImageLike)[];
  src?: ImageLike;
  sizes?: string;
}

interface ModelConfig {
  texture: ModelTexture;
  position: { x: number; y: number; z: number };
  url: string;
  animation: ModelAnimationTypeValue;
}

interface ModelProps extends HTMLAttributes<HTMLDivElement> {
  models: ModelConfig[];
  show?: boolean;
  showDelay?: number;
  cameraPosition?: { x: number; y: number; z: number };
  style?: CSSProperties;
  className?: string;
  alt?: string;
}

export const Model = ({
  models,
  show = true,
  showDelay = 0,
  cameraPosition = { x: 0, y: 0, z: 8 },
  style,
  className,
  alt,
  ...rest
}: ModelProps) => {
  const [loaded, setLoaded] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const camera = useRef<PerspectiveCamera>();
  const modelGroup = useRef<Group>();
  const scene = useRef<Scene>();
  const renderer = useRef<WebGLRenderer>();
  const shadowGroup = useRef<Group>();
  const renderTarget = useRef<WebGLRenderTarget>();
  const renderTargetBlur = useRef<WebGLRenderTarget>();
  const shadowCamera = useRef<OrthographicCamera>();
  const depthMaterial = useRef<MeshDepthMaterial>();
  const horizontalBlurMaterial = useRef<ShaderMaterial>();
  const verticalBlurMaterial = useRef<ShaderMaterial>();
  const plane = useRef<Mesh>();
  const lights = useRef<Light[]>();
  const blurPlane = useRef<Mesh>();
  const fillPlane = useRef<Mesh>();
  const isInViewport = useInViewport(container, false, { threshold: 0.2 });
  const reduceMotion = useReducedMotion();
  const rotationX = useSpring(0, rotationSpringConfig);
  const rotationY = useSpring(0, rotationSpringConfig);
  const { measureFps, isLowFps } = useFps(isInViewport);

  useEffect(() => {
    const { clientWidth, clientHeight } = container.current!;

    renderer.current = new WebGLRenderer({
      canvas: canvas.current!,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: true,
    });

    renderer.current.setPixelRatio(2);
    renderer.current.setSize(clientWidth, clientHeight);
    renderer.current.outputColorSpace = SRGBColorSpace;

    camera.current = new PerspectiveCamera(36, clientWidth / clientHeight, 0.1, 100);
    camera.current.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    scene.current = new Scene();

    modelGroup.current = new Group();
    scene.current.add(modelGroup.current);

    const ambientLight = new AmbientLight(0xffffff, 1.2);
    const keyLight = new DirectionalLight(0xffffff, 1.1);
    const fillLight = new DirectionalLight(0xffffff, 0.8);

    fillLight.position.set(-6, 2, 2);
    keyLight.position.set(0.5, 0, 0.866);
    lights.current = [ambientLight, keyLight, fillLight];
    lights.current.forEach(light => scene.current!.add(light));

    shadowGroup.current = new Group();
    scene.current.add(shadowGroup.current);
    shadowGroup.current.position.set(0, 0, -0.8);
    shadowGroup.current.rotateX(Math.PI / 2);

    const renderTargetSize = 512;
    const planeWidth = 8;
    const planeHeight = 8;
    const cameraHeight = 1.5;
    const shadowOpacity = 0.8;
    const shadowDarkness = 3;

    renderTarget.current = new WebGLRenderTarget(renderTargetSize, renderTargetSize);
    renderTarget.current.texture.generateMipmaps = false;

    renderTargetBlur.current = new WebGLRenderTarget(renderTargetSize, renderTargetSize);
    renderTargetBlur.current.texture.generateMipmaps = false;

    const planeGeometry = new PlaneGeometry(planeWidth, planeHeight).rotateX(
      Math.PI / 2
    );

    const planeMaterial = new MeshBasicMaterial({
      map: renderTarget.current.texture,
      opacity: shadowOpacity,
      transparent: true,
    });

    plane.current = new Mesh(planeGeometry, planeMaterial);
    plane.current.scale.y = -1;
    shadowGroup.current.add(plane.current);

    blurPlane.current = new Mesh(planeGeometry);
    blurPlane.current.visible = false;
    shadowGroup.current.add(blurPlane.current);

    const fillMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
    });

    fillPlane.current = new Mesh(planeGeometry, fillMaterial);
    fillPlane.current.rotateX(Math.PI);
    fillPlane.current.position.y -= 0.00001;
    shadowGroup.current.add(fillPlane.current);

    shadowCamera.current = new OrthographicCamera(
      -planeWidth / 2,
      planeWidth / 2,
      planeHeight / 2,
      -planeHeight / 2,
      0,
      cameraHeight
    );
    shadowCamera.current.rotation.x = Math.PI / 2;
    shadowGroup.current.add(shadowCamera.current);

    depthMaterial.current = new MeshDepthMaterial();
    depthMaterial.current.userData.darkness = { value: shadowDarkness };
    depthMaterial.current.onBeforeCompile = shader => {
      shader.uniforms.darkness = depthMaterial.current!.userData.darkness;
      shader.fragmentShader = `
        uniform float darkness;
        ${shader.fragmentShader.replace(
          'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
          'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
        )}
      `;
    };
    depthMaterial.current.depthTest = false;
    depthMaterial.current.depthWrite = false;

    horizontalBlurMaterial.current = new ShaderMaterial(HorizontalBlurShader);
    horizontalBlurMaterial.current.depthTest = false;

    verticalBlurMaterial.current = new ShaderMaterial(VerticalBlurShader);
    verticalBlurMaterial.current.depthTest = false;

    // eslint-disable-next-line react-hooks/immutability
    const unsubscribeX = rotationX.onChange(renderFrame);
    const unsubscribeY = rotationY.onChange(renderFrame);

    return () => {
      renderTarget.current!.dispose();
      renderTargetBlur.current!.dispose();
      removeLights(lights.current!);
      cleanScene(scene.current!);
      cleanRenderer(renderer.current!);
      unsubscribeX();
      unsubscribeY();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blurShadow = useCallback((amount: number) => {
    blurPlane.current!.visible = true;

    blurPlane.current!.material = horizontalBlurMaterial.current!;
    (blurPlane.current!.material as ShaderMaterial).uniforms.tDiffuse.value = renderTarget.current!.texture;
    horizontalBlurMaterial.current!.uniforms.h.value = amount * (1 / 256);

    renderer.current!.setRenderTarget(renderTargetBlur.current!);
    renderer.current!.render(blurPlane.current!, shadowCamera.current!);

    blurPlane.current!.material = verticalBlurMaterial.current!;
    (blurPlane.current!.material as ShaderMaterial).uniforms.tDiffuse.value = renderTargetBlur.current!.texture;
    verticalBlurMaterial.current!.uniforms.v.value = amount * (1 / 256);

    renderer.current!.setRenderTarget(renderTarget.current!);
    renderer.current!.render(blurPlane.current!, shadowCamera.current!);

    blurPlane.current!.visible = false;
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const renderFrame = useCallback(() => {
    const blurAmount = 5;

    const initialBackground = scene.current!.background;
    scene.current!.background = null;

    scene.current!.overrideMaterial = depthMaterial.current!;

    renderer.current!.setRenderTarget(renderTarget.current!);
    renderer.current!.render(scene.current!, shadowCamera.current!);

    scene.current!.overrideMaterial = null;

    blurShadow(blurAmount);

    blurShadow(blurAmount * 0.4);

    renderer.current!.setRenderTarget(null);
    scene.current!.background = initialBackground;

    modelGroup.current!.rotation.x = rotationX.get();
    modelGroup.current!.rotation.y = rotationY.get();

    renderer.current!.render(scene.current!, camera.current!);
    measureFps();

    if (isLowFps.current) {
      renderer.current!.setPixelRatio(1);
    } else {
      renderer.current!.setPixelRatio(2);
    }
  }, [blurShadow, isLowFps, measureFps, rotationX, rotationY]);

  useEffect(() => {
    const onMouseMove = (event: globalThis.MouseEvent) => {
      const { innerWidth, innerHeight } = window;

      const position = {
        x: (event.clientX - innerWidth / 2) / innerWidth,
        y: (event.clientY - innerHeight / 2) / innerHeight,
      };

      rotationY.set(position.x / 2);
      rotationX.set(position.y / 2);
    };

    if (isInViewport && !reduceMotion) {
      window.addEventListener('mousemove', onMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isInViewport, reduceMotion, rotationX, rotationY]);

  useEffect(() => {
    const handleResize = () => {
      if (!container.current) return;

      const { clientWidth, clientHeight } = container.current;

      renderer.current!.setSize(clientWidth, clientHeight);
      camera.current!.aspect = clientWidth / clientHeight;
      camera.current!.updateProjectionMatrix();

      renderFrame();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [renderFrame]);

  return (
    <div
      className={classes(styles.model, className)}
      data-loaded={loaded}
      style={cssProps({ delay: numToMs(showDelay) }, style)}
      ref={container}
      role="img"
      aria-label={alt}
      {...rest}
    >
      <canvas className={styles.canvas} ref={canvas} />
      {models.map((model, index) => (
        <Device
          key={JSON.stringify(model.position)}
          renderer={renderer}
          modelGroup={modelGroup}
          show={show}
          showDelay={showDelay}
          renderFrame={renderFrame}
          index={index}
          setLoaded={setLoaded}
          model={model}
        />
      ))}
    </div>
  );
};

interface DeviceProps {
  renderer: RefObject<WebGLRenderer | undefined>;
  model: ModelConfig;
  modelGroup: RefObject<Group | undefined>;
  renderFrame: () => void;
  index: number;
  showDelay: number;
  setLoaded: (loaded: boolean) => void;
  show: boolean;
}

interface LoadResult {
  loadFullResTexture: () => Promise<void>;
  playAnimation: () => { stop: () => void } | void;
}

const Device = ({
  renderer,
  model,
  modelGroup,
  renderFrame,
  index,
  showDelay,
  setLoaded,
  show,
}: DeviceProps) => {
  const [loadDevice, setLoadDevice] = useState<{ start: () => Promise<LoadResult> }>();
  const reduceMotion = useReducedMotion();
  const placeholderScreen = createRef<Mesh>();

  useEffect(() => {
    const applyScreenTexture = async (texture: Texture, node: Mesh) => {
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = false;
      texture.anisotropy = renderer.current!.capabilities.getMaxAnisotropy();
      texture.generateMipmaps = false;

      await renderer.current!.initTexture(texture);

      (node.material as MeshBasicMaterial).color = new Color(0xffffff);
      (node.material as MeshBasicMaterial).transparent = true;
      (node.material as MeshBasicMaterial).map = texture;
    };

    const load = async (): Promise<LoadResult> => {
      const { texture, position, url } = model;
      let loadFullResTexture: () => Promise<void> = async () => {};
      let playAnimation: () => { stop: () => void } | void = () => {};

      const [placeholder, gltf] = await Promise.all([
        textureLoader.loadAsync(
          typeof texture.placeholder === 'string' ? texture.placeholder : texture.placeholder.src
        ),
        getModelLoader().loadAsync(url),
      ]);

      modelGroup.current!.add(gltf.scene);

      gltf.scene.traverse(async (node: unknown) => {
        const meshNode = node as Mesh;
        if (meshNode.material) {
          (meshNode.material as MeshBasicMaterial).color = new Color(0x1f2025);
        }

        if (meshNode.name === MeshType.Screen) {
          (placeholderScreen as { current: Mesh | null }).current = meshNode.clone();
          (placeholderScreen.current!.material as MeshBasicMaterial) = (meshNode.material as MeshBasicMaterial).clone();
          meshNode.parent!.add(placeholderScreen.current!);
          (placeholderScreen.current!.material as MeshBasicMaterial).opacity = 1;
          placeholderScreen.current!.position.z += 0.001;

          applyScreenTexture(placeholder, placeholderScreen.current!);

          loadFullResTexture = async () => {
            const image = await resolveSrcFromSrcSet({
              srcSet: texture.srcSet as unknown as string | { src: string; width: number }[],
              sizes: texture.sizes,
            });
            const fullSize = await textureLoader.loadAsync(image);
            await applyScreenTexture(fullSize, meshNode);

            animate(1, 0, {
              onUpdate: (value: number) => {
                (placeholderScreen.current!.material as MeshBasicMaterial).opacity = value;
                renderFrame();
              },
            });
          };
        }
      });

      const targetPosition = new Vector3(position.x, position.y, position.z);

      if (reduceMotion) {
        gltf.scene.position.set(...targetPosition.toArray());
      }

      if (model.animation === ModelAnimationType.SpringUp) {
        playAnimation = () => {
          const startPosition = new Vector3(
            targetPosition.x,
            targetPosition.y - 1,
            targetPosition.z
          );

          gltf.scene.position.set(...startPosition.toArray());

          animate(startPosition.y, targetPosition.y, {
            type: 'spring',
            delay: (300 * index + showDelay) / 1000,
            stiffness: 60,
            damping: 20,
            mass: 1,
            restSpeed: 0.0001,
            restDelta: 0.0001,
            onUpdate: (value: number) => {
              gltf.scene.position.y = value;
              renderFrame();
            },
          });
        };
      }

      if (model.animation === ModelAnimationType.LaptopOpen) {
        playAnimation = () => {
          const frameNode = gltf.scene.children.find(
            (child: { name: string }) => child.name === MeshType.Frame
          )!;
          const startRotation = new Vector3(MathUtils.degToRad(90), 0, 0);
          const endRotation = new Vector3(0, 0, 0);

          gltf.scene.position.set(...targetPosition.toArray());
          frameNode.rotation.set(...startRotation.toArray());

          return animate(startRotation.x, endRotation.x, {
            type: 'spring',
            delay: (300 * index + showDelay + 300) / 1000,
            stiffness: 80,
            damping: 20,
            restSpeed: 0.0001,
            restDelta: 0.0001,
            onUpdate: (value: number) => {
              frameNode.rotation.x = value;
              renderFrame();
            },
          });
        };
      }

      return { loadFullResTexture, playAnimation };
    };

    setLoadDevice({ start: load });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loadDevice || !show) return;
    let animation: { stop: () => void } | void;

    const onLoad = async () => {
      const { loadFullResTexture, playAnimation } = await loadDevice.start();

      setLoaded(true);

      if (!reduceMotion) {
        animation = playAnimation();
      }

      await loadFullResTexture();

      if (reduceMotion) {
        renderFrame();
      }
    };

    startTransition(() => {
      onLoad();
    });

    return () => {
      animation?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDevice, show]);

  return null;
};
