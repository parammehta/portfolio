import { type UIEvent, useEffect, useRef, useState } from 'react';
import { Meta, StructuredData } from 'components';
import { personSchema } from 'utils/structuredData';
import { ExperienceCarousel } from './ExperienceCarousel';
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
  // panes are exactly one snapport tall, so an observer would be measuring a
  // degenerate boundary rect that engines disagree about.
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight } = event.currentTarget;
    setScrollIndicatorHidden(scrollTop > 0);
    setActiveSection(Math.round(scrollTop / clientHeight));
  };

  const scrollToSection = (index: number) => {
    sectionRefs[index].current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.home} data-scroll-container onScroll={handleScroll}>
      <Meta
        title="Developer + Leader"
        description="Personal website of Param Mehta – a software engineer building identity, frontend, and AI-native experiences."
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
      <ExperienceCarousel
        id="experience"
        sectionRef={experience}
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
