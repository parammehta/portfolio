import { type UIEvent, useEffect, useRef, useState } from 'react';
import { Meta, StructuredData } from 'components';
import { personSchema } from 'utils/structuredData';
import { ExperienceTimeline } from './ExperienceTimeline';
import { Intro } from './Intro';
import { Profile } from './Profile';
import { Contact } from './Contact';

import styles from './Home.module.css';

const disciplines = ['Leader', 'Mentor', 'Full-Stack', 'Coffee ☕'];

const pageSections = [
  { id: 'intro', label: 'Intro' },
  { id: 'profile', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

export const Home = () => {
  const [visibleSections, setVisibleSections] = useState<Element[]>([]);
  const [scrollIndicatorHidden, setScrollIndicatorHidden] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLElement>(null);
  const experience = useRef<HTMLElement>(null);
  const profile = useRef<HTMLElement>(null);
  const contact = useRef<HTMLElement>(null);
  const sectionRefs = [intro, profile, experience, contact];

  const isVisible = (ref: React.RefObject<HTMLElement | null>) =>
    visibleSections.includes(ref.current!);

  useEffect(() => {
    const sections = [intro, profile, experience];

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
  // panes are one snapport tall, so an observer would be measuring a degenerate
  // boundary rect that engines disagree about.
  //
  // Which pane is current comes from each section's own offsetTop, not from
  // `scrollTop / clientHeight`. That division assumed every section was exactly
  // one viewport tall, which stopped being true when the experience timeline
  // took a multi-viewport runway — it would have reported sections 2, 3, 4 and
  // 5 while you were still inside the third one.
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight } = event.currentTarget;
    setScrollIndicatorHidden(scrollTop > 0);

    // Half a viewport in, so a pane counts as current once it leads the screen
    // rather than the moment its top edge crosses.
    const marker = scrollTop + clientHeight / 2;
    const current = sectionRefs.reduce(
      (found, ref, index) =>
        ref.current && ref.current.offsetTop <= marker ? index : found,
      0
    );
    setActiveSection(current);
  };

  const scrollToSection = (index: number) => {
    sectionRefs[index].current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className={styles.home}
      data-scroll-container
      ref={container}
      onScroll={handleScroll}
    >
      <Meta
        title="Developer + Leader"
        description="Personal website of Param Mehta – a full-stack web engineer building frontend, design system, and AI-native experiences."
      />
      <StructuredData schema={personSchema()} />
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
      <ExperienceTimeline
        id="experience"
        sectionRef={experience}
        scrollContainerRef={container}
        // eslint-disable-next-line react-hooks/refs
        visible={isVisible(experience)}
      />
      <Contact id="contact" sectionRef={contact} />
      <nav className={styles.sectionDots} aria-label="Page sections">
        {pageSections.map((section, index) => (
          <button
            key={section.id}
            className={styles.dot}
            data-active={activeSection === index}
            onClick={() => scrollToSection(index)}
            aria-label={`Go to ${section.label}`}
          />
        ))}
      </nav>
    </div>
  );
};
