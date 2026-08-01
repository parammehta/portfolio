import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode, useRef } from 'react';
import {
  Breadcrumbs,
  Button,
  Heading,
  Image,
  Section,
  Text,
  Transition,
} from 'components';
import { tokens } from 'components/ThemeProvider';
import { useParallax } from 'hooks';
import { classes, cssProps, msToNum, numToMs } from 'utils/style';
import styles from './Experience.module.css';

const initDelay = 300;

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface ExperienceHeaderProps {
  title: string;
  description: string;
  linkLabel?: string;
  url?: string;
  roles?: string[];
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function ExperienceHeader({
  title,
  description,
  linkLabel = 'Visit website',
  url,
  roles,
  breadcrumbs,
  className,
}: ExperienceHeaderProps) {
  return (
    <Section className={classes(styles.header, className)} as="section">
      {!!breadcrumbs?.length && <Breadcrumbs items={breadcrumbs} />}
      <div
        className={styles.headerContent}
        style={cssProps({ initDelay: numToMs(initDelay) })}
      >
        <div className={styles.details}>
          <Heading className={styles.title} level={2} as="h1">
            {title}
          </Heading>
          <Text className={styles.description} size="xl" as="p">
            {description}
          </Text>
          {!!url && (
            <Button
              secondary
              iconHoverShift
              className={styles.linkButton}
              icon="chevronRight"
              href={url}
            >
              {linkLabel}
            </Button>
          )}
        </div>
        {!!roles?.length && (
          <ul className={styles.meta}>
            {roles?.map((role, index) => (
              <li
                className={styles.metaItem}
                style={cssProps({ delay: numToMs(initDelay + 300 + index * 140) })}
                key={role}
              >
                <Text secondary>{role}</Text>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

interface ExperienceContainerProps extends HTMLAttributes<HTMLElement> {
  className?: string;
}

export const ExperienceContainer = ({ className, ...rest }: ExperienceContainerProps) => (
  <article className={classes(styles.project, className)} {...rest} />
);

interface ExperienceSectionProps extends HTMLAttributes<HTMLElement> {
  className?: string;
  light?: boolean;
  padding?: 'both' | 'top' | 'bottom';
  fullHeight?: boolean;
  backgroundOverlayOpacity?: number;
  backgroundElement?: ReactNode;
  children?: ReactNode;
}

export const ExperienceSection = forwardRef<HTMLElement, ExperienceSectionProps>(
  (
    {
      className,
      light,
      padding = 'both',
      fullHeight,
      backgroundOverlayOpacity = 0.9,
      backgroundElement,
      children,
      ...rest
    },
    ref
  ) => (
    <section
      className={classes(styles.section, className)}
      data-light={light}
      data-full-height={fullHeight}
      ref={ref}
      {...rest}
    >
      {!!backgroundElement && (
        <div
          className={styles.sectionBackground}
          style={cssProps({ opacity: backgroundOverlayOpacity })}
        >
          {backgroundElement}
        </div>
      )}
      <Section className={styles.sectionInner} data-padding={padding}>
        {children}
      </Section>
    </section>
  )
);

interface ExperienceBackgroundProps {
  opacity?: number;
  className?: string;
  [key: string]: unknown;
}

export const ExperienceBackground = ({ opacity = 0.7, className, ...rest }: ExperienceBackgroundProps) => {
  const imageRef = useRef<HTMLDivElement>(null);

  useParallax(0.6, (value: number) => {
    if (!imageRef.current) return;
    imageRef.current.style.setProperty('--offset', `${value}px`);
  });

  return (
    <Transition in timeout={msToNum(tokens.base.durationM)}>
      {(visible: boolean) => (
        <div
          className={classes(styles.backgroundImage, className)}
          data-visible={visible}
        >
          <div className={styles.backgroundImageElement} ref={imageRef}>
            <Image alt="" role="presentation" {...rest} />
          </div>
          <div className={styles.backgroundScrim} style={cssProps({ opacity })} />
        </div>
      )}
    </Transition>
  );
};

interface ExperienceImageProps {
  className?: string;
  alt: string;
  [key: string]: unknown;
}

export const ExperienceImage = ({ className, alt, ...rest }: ExperienceImageProps) => (
  <div className={classes(styles.image, className)}>
    <Image reveal alt={alt} delay={300} {...rest} />
  </div>
);

interface ExperienceSectionContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string;
}

export const ExperienceSectionContent = ({ className, width = 'l', ...rest }: ExperienceSectionContentProps) => (
  <div
    className={classes(styles.sectionContent, className)}
    data-width={width}
    {...rest}
  />
);

interface ExperienceSectionHeadingProps {
  className?: string;
  level?: number;
  as?: ElementType;
  [key: string]: unknown;
}

export const ExperienceSectionHeading = ({
  className,
  level = 3,
  as = 'h2',
  ...rest
}: ExperienceSectionHeadingProps) => (
  <Heading
    className={classes(styles.sectionHeading, className)}
    as={as}
    level={level}
    align="auto"
    {...rest}
  />
);

interface ExperienceSectionTextProps {
  className?: string;
  [key: string]: unknown;
}

export const ExperienceSectionText = ({ className, ...rest }: ExperienceSectionTextProps) => (
  <Text className={classes(styles.sectionText, className)} size="l" as="p" {...rest} />
);

interface ExperienceTextRowProps extends HTMLAttributes<HTMLDivElement> {
  center?: boolean;
  stretch?: boolean;
  justify?: string;
  width?: string;
  noMargin?: boolean;
  className?: string;
  centerMobile?: boolean;
}

export const ExperienceTextRow = ({
  center,
  stretch,
  justify = 'center',
  width = 'm',
  noMargin,
  className,
  centerMobile,
  ...rest
}: ExperienceTextRowProps) => (
  <div
    className={classes(styles.textRow, className)}
    data-center={center}
    data-stretch={stretch}
    data-center-mobile={centerMobile}
    data-no-margin={noMargin}
    data-width={width}
    data-justify={justify}
    {...rest}
  />
);

interface ExperienceSectionColumnsProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  centered?: boolean;
}

export const ExperienceSectionColumns = ({ className, centered, ...rest }: ExperienceSectionColumnsProps) => (
  <ExperienceSectionContent
    className={classes(styles.sectionColumns, className)}
    data-centered={centered}
    {...rest}
  />
);
