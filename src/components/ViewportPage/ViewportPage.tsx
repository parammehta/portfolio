import { type ReactNode, useEffect, useState } from 'react';
import {
  Breadcrumbs,
  type BreadcrumbItem,
  Heading,
  ScrambleReveal,
  Section,
} from 'refract-ui';
import { classes } from 'utils/style';
import styles from './ViewportPage.module.css';

interface ViewportPageProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  children: ReactNode;
}

/**
 * Shell for the routes that must fit exactly one viewport: breadcrumbs and a
 * title at the top, then a content region that takes whatever height is left.
 *
 * Routes with inherently long content (articles, posts, resume, the experience
 * detail pages) use `components/Page` instead and scroll normally.
 */
export const ViewportPage = ({
  title,
  breadcrumbs,
  className,
  children,
}: ViewportPageProps) => {
  // These pages have no parent IntersectionObserver to reveal them, so the
  // entrance animation is driven off mount instead.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Section as="section" className={classes(styles.page, className)}>
      {!!breadcrumbs?.length && (
        <Breadcrumbs className={styles.breadcrumbs} items={breadcrumbs} />
      )}
      <Heading className={styles.title} level={2} as="h1" data-visible={visible}>
        <ScrambleReveal text={title} start={visible} />
      </Heading>
      <div className={styles.content}>{children}</div>
    </Section>
  );
};
