import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode, useRef } from 'react';
import { Breadcrumbs } from 'components/Breadcrumbs';
import { Button } from 'components/Button';
import { ScrambleReveal } from 'components/ScrambleReveal';
import { Heading } from 'components/Heading';
import { Image } from 'components/Image';
import { Section } from 'components/Section';
import { Text } from 'components/Text';
import { tokens } from 'components/ThemeProvider/theme';
import { Transition } from 'components/Transition';
import { useParallax } from 'hooks';
import { classes, cssProps, msToNum, numToMs } from 'utils/style';
import styles from './Page.module.css';

const initDelay = 300;

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  description: string;
  linkLabel?: string;
  url?: string;
  roles?: string[];
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  linkLabel = 'Visit website',
  url,
  roles,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <Section className={classes(styles.header, className)} as="section">
      {!!breadcrumbs?.length && <Breadcrumbs items={breadcrumbs} />}
      <div
        className={styles.headerContent}
        style={cssProps({ initDelay: numToMs(initDelay) })}
      >
        <div className={styles.details}>
          <Heading className={styles.title} level={2} as="h1">
            <ScrambleReveal text={title} />
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

interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  className?: string;
}

export const PageContainer = ({ className, ...rest }: PageContainerProps) => (
  <article className={classes(styles.page, className)} {...rest} />
);

interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  className?: string;
  light?: boolean;
  padding?: 'both' | 'top' | 'bottom' | 'none';
  fullHeight?: boolean;
  backgroundOverlayOpacity?: number;
  backgroundElement?: ReactNode;
  children?: ReactNode;
}

export const PageSection = forwardRef<HTMLElement, PageSectionProps>(
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

interface PageBackgroundProps {
  opacity?: number;
  className?: string;
  [key: string]: unknown;
}

export const PageBackground = ({ opacity = 0.7, className, ...rest }: PageBackgroundProps) => {
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

interface PageImageProps {
  className?: string;
  alt: string;
  [key: string]: unknown;
}

export const PageImage = ({ className, alt, ...rest }: PageImageProps) => (
  <div className={classes(styles.image, className)}>
    <Image reveal alt={alt} delay={300} {...rest} />
  </div>
);

interface PageSectionContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string;
}

export const PageSectionContent = ({ className, width = 'l', ...rest }: PageSectionContentProps) => (
  <div
    className={classes(styles.sectionContent, className)}
    data-width={width}
    {...rest}
  />
);

interface PageSectionHeadingProps {
  className?: string;
  level?: number;
  as?: ElementType;
  [key: string]: unknown;
}

export const PageSectionHeading = ({ className, level = 3, as = 'h2', ...rest }: PageSectionHeadingProps) => (
  <Heading
    className={classes(styles.sectionHeading, className)}
    as={as}
    level={level}
    align="auto"
    {...rest}
  />
);

interface PageSectionTextProps {
  className?: string;
  [key: string]: unknown;
}

export const PageSectionText = ({ className, ...rest }: PageSectionTextProps) => (
  <Text className={classes(styles.sectionText, className)} size="l" as="p" {...rest} />
);

interface PageTextRowProps extends HTMLAttributes<HTMLDivElement> {
  center?: boolean;
  stretch?: boolean;
  justify?: string;
  width?: string;
  noMargin?: boolean;
  className?: string;
  centerMobile?: boolean;
}

export const PageTextRow = ({
  center,
  stretch,
  justify = 'center',
  width = 'm',
  noMargin,
  className,
  centerMobile,
  ...rest
}: PageTextRowProps) => (
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

interface PageSectionColumnsProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  centered?: boolean;
}

export const PageSectionColumns = ({ className, centered, ...rest }: PageSectionColumnsProps) => (
  <PageSectionContent
    className={classes(styles.sectionColumns, className)}
    data-centered={centered}
    {...rest}
  />
);
