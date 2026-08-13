import { type UIEvent, useEffect, useRef, useState } from 'react';
import { Meta } from 'components';
import { Intro } from './Intro';
import { Profile } from './Profile';
import { Contact } from './Contact';

import styles from './Home.module.css';

const disciplines = ['Leader', 'Mentor', 'Full-Stack', 'Coffee ☕'];

export const Home = () => {
  const [visibleSections, setVisibleSections] = useState<Element[]>([]);
  const [scrollIndicatorHidden, setScrollIndicatorHidden] = useState(false);
  const intro = useRef<HTMLElement>(null);
  const profile = useRef<HTMLElement>(null);
  const contact = useRef<HTMLElement>(null);

  const isVisible = (ref: React.RefObject<HTMLElement | null>) =>
    visibleSections.includes(ref.current!);

  useEffect(() => {
    const sections = [intro, profile];

    const sectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const section = entry.target;
            observer.unobserve(section);
            if (visibleSections.includes(section)) return;
            setVisibleSections(prevSections => [...prevSections, section]);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );

    sections.forEach(section => {
      sectionObserver.observe(section.current!);
    });

    return () => {
      sectionObserver.disconnect();
    };
  }, [visibleSections]);

  // Read the container directly rather than using an IntersectionObserver: the
  // panes are exactly one snapport tall, so an observer would be measuring a
  // degenerate boundary rect that engines disagree about.
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    setScrollIndicatorHidden(event.currentTarget.scrollTop > 0);
  };

  return (
    <div className={styles.home} data-scroll-container onScroll={handleScroll}>
      <Meta
        title="Developer + Leader"
        description="Personal website of Param Mehta – a software engineer building identity, frontend, and AI-native experiences."
      />
      <Intro
        id="intro"
        sectionRef={intro}
        disciplines={disciplines}
        scrollIndicatorHidden={scrollIndicatorHidden}
      />
      <Profile
        sectionRef={profile}
        // eslint-disable-next-line react-hooks/refs
        visible={isVisible(profile)}
        id="profile"
      />
      <Contact id="contact" sectionRef={contact} />
    </div>
  );
};
