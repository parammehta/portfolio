import Barcode from 'assets/barcode.svg';
import { Footer, Meta } from 'components';
import {
  Breadcrumbs,
  Button,
  ScrambleReveal,
  Divider,
  Heading,
  Image,
  Section,
  Text,
} from 'refract-ui';
import { useReducedMotion } from 'framer-motion';
import RouterLink from 'next/link';
import { useState, useEffect, useSyncExternalStore } from 'react';
import { formatDate } from 'utils/date';
import { cssProps } from 'utils/style';
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

interface ArticlesProps {
  posts: ArticlesPostProps[];
  featured: ArticlesPostProps;
}

// `.grid`'s single-column breakpoint (Articles.module.css's --singleColumnWidth).
const singleColumnQuery = '(max-width: 1190px)';

function subscribeToColumnQuery(callback: () => void) {
  const mql = window.matchMedia(singleColumnQuery);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getIsSingleColumnSnapshot(): boolean {
  return window.matchMedia(singleColumnQuery).matches;
}

// Desktop, matching the static export's build-time render — this only
// decides which of two DOM orders ships in the initial HTML/hydration pass;
// CSS (`--singleColumnWidth`) is what actually makes mobile look right
// regardless. Driving the client value through `useSyncExternalStore`, rather
// than the plain-effect-based `useWindowSize`, means a mobile visitor gets
// the correct DOM order in the same commit as hydration instead of a visible
// reorder right after — `useWindowSize` seeds a guessed desktop width until
// its resize listener fires, which very briefly renders the wrong of the two
// structurally different layouts (list-then-featured vs. featured-first).
function getServerSnapshot(): boolean {
  return false;
}

export const Articles = ({ posts, featured }: ArticlesProps) => {
  const isSingleColumn = useSyncExternalStore(
    subscribeToColumnQuery,
    getIsSingleColumnSnapshot,
    getServerSnapshot
  );

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
