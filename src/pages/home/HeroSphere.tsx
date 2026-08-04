import { type HTMLAttributes, startTransition, useEffect, useRef } from 'react';
import { useTheme } from 'components/ThemeProvider';
import { Transition } from 'components';
import { useReducedMotion, useSpring } from 'framer-motion';
import { useInViewport, useWindowSize } from 'hooks';
import { useFps } from 'hooks/useFps';
import {
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
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
import vertShader from './heroSphere.vert.glsl';

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
  const geometry = useRef<SphereGeometry>(null!);
  const sphere = useRef<Mesh>(null!);
  const reduceMotion = useReducedMotion();
  const isInViewport = useInViewport(canvasRef);
  const windowSize = useWindowSize();
  const rotationX = useSpring(0, springConfig);
  const rotationY = useSpring(0, springConfig);
  const { measureFps, isLowFps } = useFps(isInViewport);

  useEffect(() => {
    const { innerWidth, innerHeight } = window;
    mouse.current = new Vector2(0.8, 0.5);
    renderer.current = new WebGLRenderer({
      canvas: canvasRef.current!,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: true,
    });
    renderer.current.setSize(innerWidth, innerHeight);
    renderer.current.setPixelRatio(1);
    renderer.current.outputColorSpace = LinearSRGBColorSpace;

    camera.current = new PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 100);
    camera.current.position.z = 52;

    scene.current = new Scene();

    material.current = new MeshPhongMaterial();
    material.current.onBeforeCompile = shader => {
      const [r, g, b] = (rgbAccent ?? '251 146 60').split(' ').map(v => parseInt(v) / 255);
      uniforms.current = UniformsUtils.merge([
        shader.uniforms,
        { time: { value: 0 } },
        { accentColor: { value: new Vector3(r, g, b) } },
      ]);

      shader.uniforms = uniforms.current;
      shader.vertexShader = vertShader;
      shader.fragmentShader = fragShader;
    };

    startTransition(() => {
      geometry.current = new SphereGeometry(32, 128, 128);
      sphere.current = new Mesh(geometry.current, material.current!);
      sphere.current.position.z = 0;
      (sphere.current as Mesh & { modifier: number }).modifier = Math.random();
      scene.current!.add(sphere.current);
    });

    return () => {
      cleanScene(scene.current!);
      cleanRenderer(renderer.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dirLight = new DirectionalLight(colorWhite, themeId === 'light' ? 1.8 : 2.0);
    const ambientLight = new AmbientLight(colorWhite, themeId === 'light' ? 2.7 : 1.2);

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
    const { width, height } = windowSize;

    const adjustedHeight = height + height * 0.3;
    renderer.current!.setSize(width, adjustedHeight);
    camera.current!.aspect = width / adjustedHeight;
    camera.current!.updateProjectionMatrix();

    if (reduceMotion) {
      renderer.current!.render(scene.current!, camera.current!);
    }

    if (width <= media.mobile) {
      sphere.current!.position.x = 14;
      sphere.current!.position.y = 10;
    } else if (width <= media.tablet) {
      sphere.current!.position.x = 18;
      sphere.current!.position.y = 14;
    } else {
      sphere.current!.position.x = 22;
      sphere.current!.position.y = 16;
    }
  }, [reduceMotion, windowSize]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const position = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      };

      rotationX.set(position.y / 2);
      rotationY.set(position.x / 2);
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

      if (uniforms.current !== undefined) {
        uniforms.current!.time.value = 0.00005 * (Date.now() - start.current);
      }

      sphere.current!.rotation.z += 0.001;
      sphere.current!.rotation.x = rotationX.get();
      sphere.current!.rotation.y = rotationY.get();

      renderer.current!.render(scene.current!, camera.current!);

      measureFps();

      if (isLowFps.current) {
        renderer.current!.setPixelRatio(0.5);
      } else {
        renderer.current!.setPixelRatio(1);
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
