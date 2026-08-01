import { type ReactNode, useRef, useState, useEffect } from 'react';
import {
  Breadcrumbs,
  Divider,
  Footer,
  Heading,
  Image,
  Meta,
  Section,
  Text,
  Transition,
} from 'components';
import { tokens } from 'components/ThemeProvider';
import ArrowDown from 'assets/arrow-down.svg';
import { useParallax, useScrollToHash } from 'hooks';
import RouterLink from 'next/link';
import { clamp } from 'utils/clamp';
import { formatDate } from 'utils/date';
import { cssProps, msToNum, numToMs } from 'utils/style';
import styles from './Post.module.css';

interface PostProps {
  children: ReactNode;
  title: string;
  date: string;
  abstract: string;
  banner?: string;
  timecode?: string;
  ogImage?: string;
  slug: string;
}

export const Post = ({ children, title, date, abstract, banner, timecode, ogImage, slug }: PostProps) => {
  const scrollToHash = useScrollToHash();
  const imageRef = useRef<HTMLDivElement>(null);
  const [dateTime, setDateTime] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateTime(formatDate(date));
  }, [date, dateTime]);

  useParallax(0.004, (value: number) => {
    if (!imageRef.current) return;
    imageRef.current.style.setProperty('--blurOpacity', clamp(value, 0, 1).toString());
  });

  const handleScrollIndicatorClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToHash(event.currentTarget.href);
  };

  return (
    <article className={styles.post}>
      <Meta title={title} prefix="" description={abstract} ogImage={ogImage} />
      <Section className={styles.breadcrumbSection}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Articles', href: '/articles' },
            { label: title, href: `/articles/${slug}` },
          ]}
        />
        {banner && (
          <div className={styles.banner} ref={imageRef}>
            <div className={styles.bannerImage}>
              <Image
                role="presentation"
                src={{ src: banner }}
                placeholder={{ src: `${banner.split('.')[0]}-placeholder.jpg` }}
                alt=""
              />
            </div>
            <div className={styles.bannerImageBlur}>
              <Image
                role="presentation"
                src={{ src: `${banner.split('.')[0]}-placeholder.jpg` }}
                placeholder={{ src: `${banner.split('.')[0]}-placeholder.jpg` }}
                alt=""
              />
            </div>
          </div>
        )}
      </Section>
      <Section>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <Transition in timeout={msToNum(tokens.base.durationM)}>
              {(visible: boolean) => (
                <div className={styles.date}>
                  <Divider notchWidth="64px" notchHeight="8px" collapsed={!visible} />
                  <Text className={styles.dateText} data-visible={visible}>
                    {dateTime}
                  </Text>
                </div>
              )}
            </Transition>
            <Heading level={2} as="h1" className={styles.title} aria-label={title}>
              {title.split(' ').map((word, index) => (
                <span className={styles.titleWordWrapper} key={`${word}-${index}`}>
                  <span
                    className={styles.titleWord}
                    style={cssProps({ delay: numToMs(index * 100 + 100) })}
                  >
                    {word}
                    {index !== title.split(' ').length - 1 ? ' ' : ''}
                  </span>
                </span>
              ))}
            </Heading>
            <div className={styles.details}>
              <RouterLink
                href="#postContent"
                className={styles.arrow}
                aria-label="Scroll to post content"
                onClick={handleScrollIndicatorClick}
              >
                <ArrowDown aria-hidden />
              </RouterLink>
              <div className={styles.timecode}>{timecode}</div>
            </div>
          </div>
        </header>
      </Section>
      <Section className={styles.wrapper} id="postContent" tabIndex={-1}>
        <Text as="div" size="l" className={styles.content}>
          {children}
        </Text>
      </Section>
      <Footer />
    </article>
  );
};
