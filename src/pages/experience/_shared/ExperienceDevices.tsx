import { useInViewport } from 'hooks';
import { deviceModels, Model } from 'refract-ui/model';
import { ExperienceSectionHeading } from './Experience';
import { useRef, type ReactNode } from 'react';
import { classes } from 'utils/style';
import styles from './ExperienceDevices.module.css';

interface ImageLike {
  src: string;
  width?: number;
  height?: number;
}

/**
 * The GLB screen meshes have their aspect baked into the UVs, so a texture that
 * does not match gets stretched to fit. Screenshots destined for a device need
 * to be authored at (or very near) these ratios.
 */
export const deviceScreenAspect = {
  phone: 375 / 812,
  laptop: 1280 / 800,
};

/**
 * A screen is either one image or a responsive set of the same shot at several
 * widths, matching what the flat <Image srcSet> took.
 */
type Screen = ImageLike | ImageLike[];

const toTexture = (screen: Screen) => {
  const srcSet = Array.isArray(screen) ? screen : [screen];
  return { srcSet, placeholder: srcSet[0] };
};

/**
 * One phone, centred — or two staggered, the first up and to the left and the
 * second down and to the right, which is how the flat pairs were laid out.
 */
export function phoneModels(first: Screen, second?: Screen) {
  const positions = second
    ? [
        { x: -0.6, y: 0.7, z: 0.1 },
        { x: 0.6, y: -0.7, z: 0.4 },
      ]
    : [{ x: 0, y: 0, z: 0 }];

  return [first, ...(second ? [second] : [])].map((screen, index) => ({
    ...deviceModels.phone,
    position: positions[index],
    texture: toTexture(screen),
  }));
}

/** Single-phone shorthand. */
export const phoneModel = (screen: Screen) => phoneModels(screen);

/**
 * One laptop, centred — or two staggered the same way as the phone pair. The
 * laptop is far wider than a phone, so the pair leans on depth more than on
 * horizontal offset to keep both screens readable.
 */
export function laptopModels(first: Screen, second?: Screen) {
  const positions = second
    ? [
        { x: -0.35, y: 0.6, z: 0 },
        { x: 0.35, y: -0.7, z: 1.1 },
      ]
    : [{ x: 0, y: 0, z: 0 }];

  return [first, ...(second ? [second] : [])].map((screen, index) => ({
    ...deviceModels.laptop,
    position: positions[index],
    texture: toTexture(screen),
  }));
}

/** Single-laptop shorthand. */
export const laptopModel = (screen: Screen) => laptopModels(screen);

/**
 * A laptop with a phone stood in front of it — the same product on both
 * surfaces. Both animate: the lid opens while the phone springs up.
 */
export function laptopWithPhone(laptopScreen: Screen, phoneScreen: Screen) {
  return [
    {
      ...deviceModels.laptop,
      position: { x: -1, y: 0.75, z: 0 },
      texture: toTexture(laptopScreen),
    },
    {
      ...deviceModels.phone,
      position: { x: 2.5, y: -0.35, z: 1.2 },
      texture: toTexture(phoneScreen),
    },
  ];
}

interface ExperienceDevicesProps {
  /** Model configs, from `phoneModels()` or `laptopModel()`. */
  models: ReturnType<typeof phoneModels>;
  device: 'phone' | 'laptop';
  alt: string;
  /** Which column the devices sit in. The copy takes the other one. */
  side?: 'left' | 'right';
  /** Leads the copy column. */
  heading?: ReactNode;
  /**
   * Rendered under the device, in its column. Somewhere to put stats when the
   * copy is long enough that the device would otherwise sit in a tall gap.
   */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

// Tuned so each device fills its column — the models are otherwise framed for
// a full-bleed container and read as tiny beside a column of text.
//
// The camera's vertical FOV is fixed, so the world height on screen depends on
// distance alone: a taller canvas scales the scene up rather than revealing
// more of it, and clips exactly the same fraction. Framing has to leave the
// margin, and each `z` below is set so the lowest device clears the bottom
// edge with a little room for its shadow.
const cameraPositions = {
  phone: { x: 0, y: 0, z: 9.5 },
  // A lone phone sits centred, so the camera can come in much closer than the
  // pair's framing allows.
  phoneSingle: { x: 0, y: 0, z: 7.4 },
  laptop: { x: 0, y: 0.25, z: 6.6 },
  // A second laptop needs the camera pulled back to fit both in the frame.
  laptopPair: { x: 0, y: 0, z: 9.8 },
};

const framing = (device: 'phone' | 'laptop', count: number) => {
  if (device === 'laptop') return count > 1 ? 'laptopPair' : 'laptop';
  return count > 1 ? 'phone' : 'phoneSingle';
};

/**
 * A device model in one column with its copy in the other, both vertically
 * centred, collapsing to a stack below the tablet breakpoint.
 *
 * This deliberately does not wrap the copy around the device. A float plus
 * `shape-outside` looks livelier, but it swings the measure by roughly 2x
 * between the lines beside the device and the ones below it, and it leaves a
 * hole under short copy. Centred columns hold one measure and absorb a
 * one-paragraph section without looking unfinished.
 */
export const ExperienceDevices = ({
  models,
  device,
  alt,
  side = 'right',
  heading,
  aside,
  className,
  children,
}: ExperienceDevicesProps) => {
  const container = useRef<HTMLDivElement>(null);
  // Model only fetches its GLB and screen textures once `show` flips, so hold
  // that until the block is close to the viewport.
  const visible = useInViewport(container, true, { rootMargin: '0px 0px 25% 0px' });

  return (
    <div
      className={classes(styles.devices, className)}
      data-side={side}
      data-device={device}
      data-count={models.length}
      data-aside={!!aside}
      ref={container}
    >
      <Model
        className={styles.model}
        alt={alt}
        cameraPosition={cameraPositions[framing(device, models.length)]}
        show={visible}
        showDelay={300}
        models={models}
      />
      <div className={styles.copy}>
        {!!heading && <ExperienceSectionHeading>{heading}</ExperienceSectionHeading>}
        {children}
      </div>
      {!!aside && <div className={styles.aside}>{aside}</div>}
    </div>
  );
};
