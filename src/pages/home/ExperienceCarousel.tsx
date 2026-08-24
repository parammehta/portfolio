import { type RefObject, useState } from 'react';
import { Button, Heading, Section, Text } from 'refract-ui';
import { Model } from 'refract-ui/model';
import intuitLaptop from 'assets/intuit-design-system-1.png';
import intuitPhone from 'assets/intuit-passkey-enrollment.png';
import rivianLaptop from 'assets/rivian-fleet-os-1.png';
import rivianPhone from 'assets/rivian-fleet-os-mobile-1.png';
import walmartLaptop from 'assets/walmart-home-1.png';
import walmartPhone from 'assets/walmart-mobile-seller-1.png';
import { companies, companyHref } from 'data/experience';
import { laptopWithPhone } from 'pages/experience/_shared';
import { analyticsEvents, trackEvent } from 'utils/analytics';
import styles from './ExperienceCarousel.module.css';

/**
 * Screens are keyed by slug rather than listed inline so the order always
 * follows `data/experience`, which is the source of truth for work history.
 */
const screens = {
  intuit: { laptop: intuitLaptop, phone: intuitPhone },
  rivian: { laptop: rivianLaptop, phone: rivianPhone },
  walmart: { laptop: walmartLaptop, phone: walmartPhone },
};

const slides = companies.map(company => ({
  slug: company.slug,
  name: company.name,
  dateRange: company.dateRange,
  role: company.roles[0].title,
  models: laptopWithPhone(screens[company.slug].laptop, screens[company.slug].phone),
}));

/**
 * Where a slide sits relative to the focused one, as -1 / 0 / 1 with the ends
 * wrapping round. Every slide is always on screen, so this is a position and
 * never a visibility test.
 */
const offsetFrom = (index: number, active: number) => {
  const half = Math.floor(slides.length / 2);
  return ((index - active + half + slides.length) % slides.length) - half;
};

interface ExperienceCarouselProps {
  id: string;
  sectionRef: RefObject<HTMLElement | null>;
  visible: boolean;
}

export const ExperienceCarousel = ({
  id,
  sectionRef,
  visible,
}: ExperienceCarouselProps) => {
  const [index, setIndex] = useState(0);
  const active = slides[index];
  const titleId = `${id}-title`;

  const go = (next: number) => {
    const wrapped = (next + slides.length) % slides.length;
    setIndex(wrapped);
    trackEvent(analyticsEvents.homeExperienceSlide, { company: slides[wrapped].slug });
  };

  return (
    <Section
      className={styles.experience}
      as="section"
      id={id}
      ref={sectionRef}
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className={styles.content}>
        <Heading className={styles.title} level={3} id={titleId}>
          Where I&apos;ve worked
        </Heading>

        <div
          className={styles.stage}
          role="group"
          aria-roledescription="carousel"
          aria-label="Experience"
        >
          {slides.map((slide, slideIndex) => {
            const offset = offsetFrom(slideIndex, index);
            const focused = offset === 0;

            return (
              <div
                key={slide.slug}
                className={styles.slide}
                data-offset={offset}
                data-focused={focused}
                aria-hidden={!focused}
              >
                {/* The models mount only once the pane has been reached. Model
                    builds its WebGLRenderer on mount — `show` gates the GLB and
                    texture load, not the context — so rendering them up front
                    would put three contexts on the landing page before anyone
                    scrolls to them. */}
                {visible && (
                  <Model
                    className={styles.model}
                    alt={`${slide.name} — the product on desktop and mobile.`}
                    cameraPosition={{ x: 0.5, y: 0, z: 10.4 }}
                    show
                    showDelay={200 + slideIndex * 150}
                    models={slide.models}
                  />
                )}
                {!focused && (
                  <button
                    className={styles.slideButton}
                    onClick={() => go(slideIndex)}
                    // Restored to the tab order by the dots below, which name
                    // the same slides without sitting under an aria-hidden.
                    tabIndex={-1}
                  >
                    <span className={styles.visuallyHidden}>Show {slide.name}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.caption} aria-live="polite">
          <Text className={styles.company} size="l" as="p">
            {active.name}
          </Text>
          <Text className={styles.role} secondary as="p">
            {active.role} &middot; {active.dateRange}
          </Text>
        </div>

        <div className={styles.controls}>
          <button
            className={styles.arrow}
            onClick={() => go(index - 1)}
            aria-label="Previous experience"
          >
            &larr;
          </button>
          <div className={styles.dots}>
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.slug}
                className={styles.dot}
                data-active={slideIndex === index}
                onClick={() => go(slideIndex)}
                aria-label={slide.name}
                aria-current={slideIndex === index}
              />
            ))}
          </div>
          <button
            className={styles.arrow}
            onClick={() => go(index + 1)}
            aria-label="Next experience"
          >
            &rarr;
          </button>
        </div>

        <Button
          secondary
          className={styles.button}
          href={companyHref(active.slug)}
          icon="chevronRight"
          iconHoverShift
        >
          Read about {active.name}
        </Button>
      </div>
    </Section>
  );
};
