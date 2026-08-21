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
 * Two phones, staggered — the first up and to the left, the second down and to
 * the right, which is how the flat screenshot pairs were laid out before.
 */
export function phoneModels(first: ImageLike, second: ImageLike) {
  return [
    { texture: first, position: { x: -0.6, y: 0.8, z: 0.1 } },
    { texture: second, position: { x: 0.6, y: -0.8, z: 0.4 } },
  ].map(({ texture, position }) => ({
    ...deviceModels.phone,
    position,
    texture: { srcSet: [texture], placeholder: texture },
  }));
}

export function laptopModel(texture: ImageLike) {
  return [
    {
      ...deviceModels.laptop,
      position: { x: 0, y: 0, z: 0 },
      texture: { srcSet: [texture], placeholder: texture },
    },
  ];
}

interface ExperienceDevicesProps {
  /** Model configs, from `phoneModels()` or `laptopModel()`. */
  models: ReturnType<typeof phoneModels>;
  device: 'phone' | 'laptop';
  alt: string;
  /** Which side the devices float to. Text wraps around the other side. */
  side?: 'left' | 'right';
  /** Rendered above the float at full width, so it still leads the section. */
  heading?: ReactNode;
  className?: string;
  children: ReactNode;
}

// Tuned so each device fills its float box — the models are otherwise framed
// for a full-bleed container and read as tiny next to a column of text.
const cameraPositions = {
  phone: { x: 0, y: 0, z: 9 },
  laptop: { x: 0, y: 0.25, z: 6.6 },
};

/**
 * A device model floated into a column of copy, so the text wraps around it
 * rather than sitting in its own rigid column. Below the tablet breakpoint the
 * float is dropped and the two stack, because there is not enough measure left
 * for a wrapped paragraph to stay readable.
 */
export const ExperienceDevices = ({
  models,
  device,
  alt,
  side = 'right',
  heading,
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
      ref={container}
    >
      {!!heading && <ExperienceSectionHeading>{heading}</ExperienceSectionHeading>}
      <Model
        className={styles.model}
        alt={alt}
        cameraPosition={cameraPositions[device]}
        show={visible}
        showDelay={300}
        models={models}
      />
      {children}
    </div>
  );
};
