import Barcode from 'assets/barcode.svg';
import {
  Breadcrumbs,
  Button,
  ScrambleReveal,
  Divider,
  Footer,
  Heading,
  Image,
  Meta,
  Section,
  Text,
} from 'components';
import { useReducedMotion } from 'framer-motion';
import { useWindowSize } from 'hooks';
import RouterLink from 'next/link';
import { useState, useEffect } from 'react';
import { formatDate } from 'utils/date';
import { classes, cssProps } from 'utils/style';
import styles from './Articles.module.css';

interface ArticlesPostProps {
  slug: string;
  title: string;
  abstract: string;
  date: string;
  featured?: boolean;
  banner?: string;
  timecode?: string;
  index?: number;
}

const ArticlesPost = ({
  slug,
  title,
  abstract,
  date,
  featured,
  banner,
  timecode,
  index,
}: ArticlesPostProps) => {
  const [hovered, setHovered] = useState(false);
  const [dateTime, setDateTime] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Deferred to client-only render since toLocaleDateString depends on the
    // runtime locale, which can differ between the static-export build and
    // the browser (avoids a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateTime(formatDate(date));
  }, [date, dateTime]);

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  return (
    <article
      className={styles.post}
      data-featured={!!featured}
      style={index !== undefined ? cssProps({ delay: index * 100 + 200 }) : undefined}
    >
      {featured && (
        <Text className={styles.postLabel} size="s">
          Featured
        </Text>
      )}
      {featured && !!banner && (
        <div className={styles.postImage}>
          <Image
            noPauseButton
            play={!reduceMotion ? hovered : undefined}
            src={{ src: banner }}
            placeholder={{ src: `${banner.split('.')[0]}-placeholder.jpg` }}
            alt=""
            role="presentation"
          />
        </div>
      )}
      <RouterLink
        href={`/articles/${slug}`}
        scroll={false}
        className={styles.postLink}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.postDetails}>
          <div aria-hidden className={styles.postDate}>
            <Divider notchWidth="64px" notchHeight="8px" />
            {dateTime}
          </div>
          <Heading as="h2" level={featured ? 2 : 4}>
            {title}
          </Heading>
          <Text size={featured ? 'l' : 's'} as="p">
            {abstract}
          </Text>
          <div className={styles.postFooter}>
            <Button secondary iconHoverShift icon="chevronRight" as="div">
              Read article
            </Button>
            <Text className={styles.timecode} size="s">
              {timecode}
            </Text>
          </div>
        </div>
      </RouterLink>
      {featured && (
        <Text aria-hidden className={styles.postTag} size="s">
          477
        </Text>
      )}
    </article>
  );
};

interface SkeletonPostProps {
  index?: number;
}

const SkeletonPost = ({ index }: SkeletonPostProps) => {
  return (
    <article
      aria-hidden="true"
      className={classes(styles.post, styles.skeleton)}
      style={index !== undefined ? cssProps({ delay: index * 100 + 200 }) : undefined}
    >
      <div className={styles.postLink}>
        <div className={styles.postDetails}>
          <div aria-hidden className={styles.postDate}>
            <Divider notchWidth="64px" notchHeight="8px" />
            Coming soon...
          </div>
          <Heading
            className={styles.skeletonBone}
            as="h2"
            level={4}
            style={{ height: 24, width: '70%' }}
          />
          <Text
            className={styles.skeletonBone}
            size="s"
            as="p"
            style={{ height: 90, width: '100%' }}
          />
          <div className={styles.postFooter}>
            <Button secondary iconHoverShift icon="chevronRight" as="div">
              Read more
            </Button>
            <Text className={styles.timecode} size="s">
              00:00:00:00
            </Text>
          </div>
        </div>
      </div>
    </article>
  );
};

interface ArticlesProps {
  posts: ArticlesPostProps[];
  featured: ArticlesPostProps;
}

export const Articles = ({ posts, featured }: ArticlesProps) => {
  const { width } = useWindowSize();
  const singleColumnWidth = 1190;
  const isSingleColumn = width <= singleColumnWidth;

  const postsHeader = (
    <header className={styles.header}>
      <Breadcrumbs
        className={styles.breadcrumbs}
        items={[
          { label: 'Home', href: '/' },
          { label: 'Articles', href: '/articles' },
        ]}
      />
      <Heading className={styles.heading} level={5} as="h1">
        <ScrambleReveal text="Latest articles" />
      </Heading>
      <Barcode />
    </header>
  );

  const postList = (
    <div className={styles.list}>
      {!isSingleColumn && postsHeader}
      {posts.map(({ slug, ...post }, index) => (
        <ArticlesPost key={slug} slug={slug} index={index} {...post} />
      ))}
      {Array(2)
        .fill(null)
        .map((_, index) => (
          <SkeletonPost key={index} />
        ))}
    </div>
  );

  const featuredPost = <ArticlesPost {...featured} />;

  return (
    <article className={styles.articles}>
      <Meta
        title="Articles"
        description="A collection of technical design and development articles. May contain incoherent ramblings."
      />
      <Section className={styles.content}>
        {!isSingleColumn && (
          <div className={styles.grid}>
            {postList}
            {featuredPost}
          </div>
        )}
        {isSingleColumn && (
          <div className={styles.grid}>
            {postsHeader}
            {featuredPost}
            {postList}
          </div>
        )}
      </Section>
      <Footer />
    </article>
  );
};
