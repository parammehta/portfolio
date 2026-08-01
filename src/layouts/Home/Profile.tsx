import { Fragment, type RefObject, useState } from 'react';
import {
  Button,
  DecoderText,
  Divider,
  Heading,
  Image,
  Link,
  Section,
  Text,
  Transition,
} from 'components';
import profileKatakana from 'assets/katakana-profile.svg?url';
import profileImgLarge from 'assets/profile-large.jpg';
import profileImgPlaceholder from 'assets/profile-placeholder.jpg';
import profileImg from 'assets/profile.jpg';
import { media } from 'utils/style';
import styles from './Profile.module.css';

interface ProfileTextProps {
  visible: boolean;
  titleId: string;
}

const ProfileText = ({ visible, titleId }: ProfileTextProps) => (
  <Fragment>
    <Heading className={styles.title} data-visible={visible} level={3} id={titleId}>
      <DecoderText text="Hi there" start={visible} delay={500} />
    </Heading>
    <Text className={styles.description} data-visible={visible} size="l" as="p">
      I&apos;m Param, a software engineer with 8+ years at the intersection of
      engineering, design, and AI. I live in the San Francisco Bay Area and work as a
      senior software engineer at <Link href="https://www.intuit.com">Intuit</Link>, where
      I build identity and authentication experiences, prototype AI-native patterns with
      Claude and MCP, and maintain the Storybook environment Design and PM partners use to
      sign off on live components before anything ships. If you&apos;re curious about the
      tools and tech I use day to day, check out my <Link href="/#skills">skills page</Link>.
    </Text>
    <Text className={styles.description} data-visible={visible} size="l" as="p">
      In my spare time I play soccer ⚽, hike around 🧗🏼 and also play video games 🎮. I
      also love travelling around new places and taste new cuisine.
    </Text>
    <Text className={styles.description} data-visible={visible} size="l" as="p">
      I occasionally write about frontend engineering over on my{' '}
      <Link href="/articles">articles page</Link>, and I&apos;m always down for hearing
      about new projects, so feel free to drop me a line.
    </Text>
  </Fragment>
);

interface ProfileProps {
  id: string;
  visible: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}

export const Profile = ({ id, visible, sectionRef }: ProfileProps) => {
  const [focused, setFocused] = useState(false);
  const titleId = `${id}-title`;

  return (
    <Section
      className={styles.profile}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      as="section"
      id={id}
      ref={sectionRef}
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <Transition in={visible || focused} timeout={0}>
        {(visible: boolean) => (
          <div className={styles.content}>
            <div className={styles.column}>
              <ProfileText visible={visible} titleId={titleId} />
              <Button
                secondary
                className={styles.button}
                data-visible={visible}
                href="/contact"
                icon="send"
              >
                Send me a message
              </Button>
            </div>
            <div className={styles.column}>
              <div className={styles.tag} aria-hidden>
                <Divider
                  notchWidth="64px"
                  notchHeight="8px"
                  collapsed={!visible}
                  collapseDelay={1000}
                />
                <div className={styles.tagText} data-visible={visible}>
                  About Me
                </div>
              </div>
              <div className={styles.image}>
                <Image
                  reveal
                  delay={100}
                  placeholder={profileImgPlaceholder}
                  srcSet={[profileImg, profileImgLarge]}
                  sizes={`(max-width: ${media.mobile}px) 100vw, 480px`}
                  alt="Me Standing in front of the Tahoe Lake."
                />
                <svg
                  aria-hidden="true"
                  width="135"
                  height="765"
                  viewBox="0 0 135 765"
                  className={styles.svg}
                  data-visible={visible}
                >
                  <use href={`${profileKatakana}#katakana-profile`} />
                </svg>
              </div>
            </div>
          </div>
        )}
      </Transition>
    </Section>
  );
};
