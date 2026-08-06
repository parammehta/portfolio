import { type RefObject, useState } from 'react';
import { Button, Heading, Section, Text, Transition } from 'components';
import { deviceModels } from 'components/Model/deviceModels';
import { useTheme } from 'components/ThemeProvider';
import experienceDevanagari from 'assets/devanagari-experience.svg?url';
import { useWindowSize } from 'hooks';
import dynamic from 'next/dynamic';
import { cssProps, media } from 'utils/style';
import styles from './ExperienceSummary.module.css';

const Model = dynamic(() => import('components/Model').then(mod => mod.Model));

import type { StaticImageData } from 'next/image';

interface TextureItem {
  srcSet: (string | StaticImageData)[];
  placeholder: string | StaticImageData;
  sizes?: string;
}

interface ExperienceModel {
  type: 'laptop' | 'phone';
  alt: string;
  textures: TextureItem[];
}

interface ExperienceSummaryProps {
  id: string;
  visible: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  dateRange: string;
  title: string;
  description: string;
  model: ExperienceModel;
  buttonText: string;
  buttonLink: string;
  alternate?: boolean;
}

export const ExperienceSummary = ({
  id,
  visible: sectionVisible,
  sectionRef,
  dateRange,
  title,
  description,
  model,
  buttonText,
  buttonLink,
  alternate,
  ...rest
}: ExperienceSummaryProps) => {
  const [focused, setFocused] = useState(false);
  const theme = useTheme();
  const { width } = useWindowSize();
  const titleId = `${id}-title`;
  const isMobile = width <= media.tablet;
  const svgOpacity = theme.themeId === 'light' ? 0.7 : 0.18;
  const phoneSizes = `(max-width: ${media.tablet}px) 30vw, 20vw`;
  const laptopSizes = `(max-width: ${media.tablet}px) 80vw, 40vw`;
  const descriptionArr = description.split('. ');

  const renderDevanagari = (device: string, visible: boolean) => (
    <svg
      aria-hidden="true"
      width="900"
      height="240"
      viewBox="0 0 900 240"
      data-visible={visible}
      data-light={theme.themeId === 'light'}
      style={cssProps({ opacity: svgOpacity })}
      className={styles.svg}
      data-device={device}
    >
      <use href={`${experienceDevanagari}#devanagari-experience`} />
    </svg>
  );

  const renderDetails = (visible: boolean) => (
    <div className={styles.details}>
      <Heading
        level={4}
        as="h2"
        className={styles.title}
        data-visible={visible}
        id={titleId}
      >
        {title}
      </Heading>
      <Text className={styles.companyText} data-visible={visible} as="div">
        {dateRange}
      </Text>
      <Text className={styles.description} data-visible={visible} as="div">
        <ul>
          {descriptionArr.map((descriptionRow, index) => (
            <li key={index}>{descriptionRow}</li>
          ))}
        </ul>
      </Text>
      <div className={styles.button} data-visible={visible}>
        <Button iconHoverShift href={buttonLink} iconEnd="arrowRight">
          {buttonText}
        </Button>
      </div>
    </div>
  );

  const renderPreview = (visible: boolean) => (
    <div className={styles.preview}>
      {model.type === 'laptop' && (
        <>
          {renderDevanagari('laptop', visible)}
          <div className={styles.model} data-device="laptop">
            <Model
              alt={model.alt}
              cameraPosition={{ x: 0, y: 0, z: 8 }}
              showDelay={700}
              show={visible}
              models={[
                {
                  ...deviceModels.laptop,
                  texture: {
                    ...model.textures[0],
                    sizes: laptopSizes,
                  },
                },
              ]}
            />
          </div>
        </>
      )}
      {model.type === 'phone' && (
        <>
          {renderDevanagari('phone', visible)}
          <div className={styles.model} data-device="phone">
            <Model
              alt={model.alt}
              cameraPosition={{ x: 0, y: 0, z: 11.5 }}
              showDelay={300}
              show={visible}
              models={[
                {
                  ...deviceModels.phone,
                  position: { x: -0.6, y: 1.1, z: 0 },
                  texture: {
                    ...model.textures[0],
                    sizes: phoneSizes,
                  },
                },
                {
                  ...deviceModels.phone,
                  position: { x: 0.6, y: -0.5, z: 0.3 },
                  texture: {
                    ...model.textures[1],
                    sizes: phoneSizes,
                  },
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <Section
      className={styles.summary}
      data-alternate={alternate}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      as="article"
      aria-labelledby={titleId}
      ref={sectionRef}
      id={id}
      tabIndex={-1}
      {...rest}
    >
      <Transition in={sectionVisible || focused}>
        {(visible: boolean) => (
          <div className={styles.content}>
            {!alternate && !isMobile && (
              <>
                {renderDetails(visible)}
                {renderPreview(visible)}
              </>
            )}
            {(alternate || isMobile) && (
              <>
                {renderPreview(visible)}
                {renderDetails(visible)}
              </>
            )}
          </div>
        )}
      </Transition>
    </Section>
  );
};
