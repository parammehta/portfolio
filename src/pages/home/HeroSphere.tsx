import { type HTMLAttributes, startTransition, useEffect, useRef, useState } from 'react';
import { Transition, useTheme } from 'refract-ui';
import { useReducedMotion, useSpring } from 'framer-motion';
import { useInViewport } from 'hooks';
import { useFps } from 'hooks/useFps';
import {
  AmbientLight,
  DirectionalLight,
  IcosahedronGeometry,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  LinearSRGBColorSpace,
  UniformsUtils,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { IUniform } from 'three';
import { media } from 'utils/style';
import { cleanRenderer, cleanScene, removeLights } from 'utils/three';
import styles from './HeroSphere.module.css';
import fragShader from './heroSphere.frag.glsl';

const RADIUS = 32;
const OVERHANG = 0.2;
// Mobile: sphere radius as a multiple of viewport height, and how far down the
// viewport its lowest point reaches. Radius > coverage keeps the equator off
// the top of the screen so only the lower dome is visible.
const MOBILE_DOME_RADIUS = 0.7;
const MOBILE_DOME_COVERAGE = 0.62;

const springConfig = {
  stiffness: 30,
  damping: 20,
  mass: 2,
};

export const HeroSphere = (props: HTMLAttributes<HTMLCanvasElement>) => {
  const theme = useTheme();
  const { themeId, colorWhite, rgbAccent } = theme as unknown as {
    themeId: string;
    colorWhite: string;
    rgbAccent: string;
  };
  // eslint-disable-next-line react-hooks/purity
  const start = useRef<number>(Date.now());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef<Vector2>(null!);
  const renderer = useRef<WebGLRenderer>(null!);
  const camera = useRef<PerspectiveCamera>(null!);
  const scene = useRef<Scene>(null!);
  const lights = useRef<(DirectionalLight | AmbientLight)[]>(null!);
  const uniforms = useRef<Record<string, IUniform>>(null!);
  const material = useRef<MeshPhongMaterial>(null!);
  const geometry = useRef<IcosahedronGeometry>(null!);
  const polyhedron = useRef<Mesh>(null!);
  const baseScale = useRef(1);
  const baseRotationY = useRef(0);
  const reduceMotion = useReducedMotion();
  const isInViewport = useInViewport(canvasRef);
  // Measured off the pane rather than useWindowSize: that hook's iOS ruler
  // reports the *large* viewport height, but the pane is sized in `dvh`, so on
  // mobile the canvas would be 30% taller than intended and the dome maths
  // below would place the sphere against the wrong height.
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const rotationX = useSpring(0, springConfig);
  const rotationY = useSpring(0, springConfig);
  const { measureFps, isLowFps } = useFps(isInViewport);

  useEffect(() => {
    const { innerWidth, innerHeight } = window;
    mouse.current = new Vector2(0.8, 0.5);
    renderer.current = new WebGLRenderer({
      canvas: canvasRef.current!,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: true,
    });
    renderer.current.setSize(innerWidth, innerHeight);
    renderer.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.current.outputColorSpace = LinearSRGBColorSpace;

    camera.current = new PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 100);
    camera.current.position.z = 52;

    scene.current = new Scene();

    material.current = new MeshPhongMaterial({ flatShading: true, shininess: 40 });
    material.current.onBeforeCompile = shader => {
      const [r, g, b] = (rgbAccent ?? '251 146 60')
        .split(' ')
        .map(v => parseInt(v) / 255);
      uniforms.current = UniformsUtils.merge([
        shader.uniforms,
        { accentColor: { value: new Vector3(r, g, b) } },
      ]);

      shader.uniforms = uniforms.current;
      shader.fragmentShader = fragShader;
    };

    startTransition(() => {
      geometry.current = new IcosahedronGeometry(RADIUS, 1);
      polyhedron.current = new Mesh(geometry.current, material.current!);
      polyhedron.current.position.z = 0;
      scene.current!.add(polyhedron.current);
    });

    return () => {
      cleanScene(scene.current!);
      cleanRenderer(renderer.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dirLight = new DirectionalLight(colorWhite, themeId === 'light' ? 1.6 : 2.0);
    const ambientLight = new AmbientLight(colorWhite, themeId === 'light' ? 2.0 : 1.6);

    dirLight.position.z = 200;
    dirLight.position.x = 100;
    dirLight.position.y = 100;

    lights.current = [dirLight, ambientLight];
    lights.current.forEach(light => scene.current!.add(light));

    return () => {
      removeLights(lights.current!);
    };
  }, [colorWhite, themeId]);

  useEffect(() => {
    if (!uniforms.current) return;
    const [r, g, b] = (rgbAccent ?? '251 146 60').split(' ').map(v => parseInt(v) / 255);
    uniforms.current.accentColor.value.set(r, g, b);
  }, [rgbAccent]);

  useEffect(() => {
    const parent = canvasRef.current?.parentElement;
    if (!parent) return;

    // offsetWidth/offsetHeight, not entry.contentRect: the pane is a Section
    // with ~320px of horizontal padding, and the canvas is `inset: 0` so it
    // covers the padding box. Measuring the content box would hand the renderer
    // a width narrower than the canvas actually is — enough, on a ~1200px
    // window, to fall under the tablet breakpoint and pick the wrong scale.
    const resizeObserver = new ResizeObserver(() => {
      setCanvasSize({ width: parent.offsetWidth, height: parent.offsetHeight });
    });

    resizeObserver.observe(parent);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = canvasSize;
    if (!width || !height) return;

    const adjustedHeight = height + height * 0.3;
    renderer.current!.setSize(width, adjustedHeight);
    camera.current!.aspect = width / adjustedHeight;
    camera.current!.updateProjectionMatrix();

    // Position half off the right edge at every aspect ratio
    const vFov = (camera.current!.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFov / 2) * camera.current!.position.z;
    const visibleWidth = visibleHeight * camera.current!.aspect;

    // The canvas is rendered 30% taller than the viewport and top-aligned, so
    // only this much of `visibleHeight` actually falls inside the viewport.
    const viewportWorldHeight = visibleHeight / 1.3;

    let scale = 1;
    if (width <= media.mobile) {
      // Big enough that the equator sits above the viewport and the sides
      // bleed off — only the lower dome of the sphere is ever on screen.
      scale = (viewportWorldHeight * MOBILE_DOME_RADIUS) / RADIUS;
    } else if (width <= media.tablet) {
      scale = 0.5;
    }
    baseScale.current = scale;
    polyhedron.current!.scale.setScalar(scale);

    const effectiveRadius = RADIUS * scale;
    if (width <= media.mobile) {
      // Centre horizontally, and sink the sphere so its lowest point lands at
      // the vertical midpoint of the viewport — a dome covering the top half.
      polyhedron.current!.position.x = 0;
      polyhedron.current!.position.y =
        visibleHeight / 2 - viewportWorldHeight * MOBILE_DOME_COVERAGE + effectiveRadius;
    } else {
      // Anchor to the top-right corner, cropped by both edges.
      polyhedron.current!.position.x = visibleWidth / 2 - effectiveRadius * OVERHANG;
      polyhedron.current!.position.y = visibleHeight / 2 - effectiveRadius * OVERHANG;
    }

    if (reduceMotion) {
      renderer.current!.render(scene.current!, camera.current!);
    }
  }, [reduceMotion, canvasSize]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const position = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      };

      rotationX.set(position.y / 4);
      rotationY.set(position.x / 4);
    };

    if (!reduceMotion && isInViewport) {
      window.addEventListener('mousemove', onMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isInViewport, reduceMotion, rotationX, rotationY]);

  useEffect(() => {
    let animation: number;

    const animate = () => {
      animation = requestAnimationFrame(animate);

      const t = 0.001 * (Date.now() - start.current);

      baseRotationY.current += 0.0015;
      polyhedron.current!.rotation.y = baseRotationY.current + rotationY.get();
      polyhedron.current!.rotation.z += 0.0004;
      polyhedron.current!.rotation.x = rotationX.get();

      // Gentle breathing
      const s = baseScale.current * (1 + 0.02 * Math.sin(t * 0.7));
      polyhedron.current!.scale.setScalar(s);

      renderer.current!.render(scene.current!, camera.current!);

      measureFps();

      if (isLowFps.current) {
        renderer.current!.setPixelRatio(0.5);
      } else {
        renderer.current!.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    };

    if (!reduceMotion && isInViewport) {
      animate();
    } else {
      renderer.current!.render(scene.current!, camera.current!);
    }

    return () => {
      cancelAnimationFrame(animation);
    };
  }, [isInViewport, measureFps, reduceMotion, isLowFps, rotationX, rotationY]);

  return (
    <Transition in timeout={3000}>
      {(visible: boolean) => (
        <canvas
          aria-hidden
          className={styles.canvas}
          data-visible={visible}
          ref={canvasRef}
          {...props}
        />
      )}
    </Transition>
  );
};
