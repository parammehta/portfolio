import { type RefObject, useCallback, useMemo, useState } from 'react';
import { Button, Heading, Section, Text, VisuallyHidden } from 'refract-ui';
import { ScrollTimeline, type ScrollTimelineItem } from 'refract-ui';
import { Model } from 'refract-ui/model';
import intuitLaptop from 'assets/intuit-design-system-1.png';
import intuitPhone from 'assets/intuit-passkey-enrollment.png';
import rivianLaptop from 'assets/rivian-fleet-os-1.png';
import rivianPhone from 'assets/rivian-fleet-os-mobile-1.png';
import walmartLaptop from 'assets/walmart-home-1.png';
import walmartPhone from 'assets/walmart-mobile-seller-1.png';
import { companies, type CompanySlug, companyHref } from 'data/experience';
import { laptopWithPhone } from 'pages/experience/_shared';
import { analyticsEvents, trackEvent } from 'utils/analytics';
import styles from './ExperienceTimeline.module.css';

/**
 * Screens are keyed by slug rather than listed inline so the order always
 * follows `data/experience`, which is the source of truth for work history.
 */
const screens = {
  intuit: { laptop: intuitLaptop, phone: intuitPhone },
  rivian: { laptop: rivianLaptop, phone: rivianPhone },
  walmart: { laptop: walmartLaptop, phone: walmartPhone },
};

const accents: Record<CompanySlug, string> = {
  intuit: '#7d6bff',
  rivian: '#3ec4a5',
  walmart: '#f2b134',
};

interface RoleNode extends ScrollTimelineItem {
  slug: CompanySlug;
  companyName: string;
  title: string;
  dateRange: string;
  tech: string[];
  models: ReturnType<typeof laptopWithPhone>;
}

/**
 * One node per role, not per company — the timeline's whole argument is that
 * the roles are a sequence, and collapsing three Walmart years into one node
 * would flatten the part worth showing.
 *
 * `companies` is newest-first and each company's `roles` are too, so a flat map
 * already reads present → past left to right. Nothing here re-sorts; if the
 * order ever looks wrong, the data is what's wrong.
 */
const nodes: RoleNode[] = companies.flatMap(company =>
  company.roles.map(role => ({
    id: role.id,
    // Consecutive roles at the same company band under one heading.
    group: company.shortName,
    label: `${role.title} at ${company.name}, ${role.dateRange}`,
    accent: accents[company.slug],
    slug: company.slug,
    companyName: company.name,
    title: role.title,
    dateRange: role.dateRange,
    tech: role.tech.slice(0, 3),
    models: laptopWithPhone(screens[company.slug].laptop, screens[company.slug].phone),
  }))
);

/**
 * How many cards either side of the active one keep a live model. Model builds
 * a WebGLRenderer per instance, and browsers cap the number of live contexts —
 * mounting all six would sit near that ceiling for the whole page, on a landing
 * page that also runs the hero sphere. Three at a time covers what's legible at
 * this scale; the rest render their caption alone until they come round.
 */
const MODEL_WINDOW = 1;

interface ExperienceTimelineProps {
  id: string;
  sectionRef: RefObject<HTMLElement | null>;
  scrollContainerRef: RefObject<HTMLElement | null>;
  visible: boolean;
}

export const ExperienceTimeline = ({
  id,
  sectionRef,
  scrollContainerRef,
  visible,
}: ExperienceTimelineProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = nodes[activeIndex];
  const titleId = `${id}-title`;

  const onActiveChange = useCallback((_item: ScrollTimelineItem, index: number) => {
    setActiveIndex(index);
    trackEvent(analyticsEvents.homeExperienceSlide, { company: nodes[index].slug });
  }, []);

  const renderItem = useCallback(
    (item: ScrollTimelineItem, state: { distance: number; active: boolean }) => {
      const node = item as RoleNode;
      const withModel = visible && Math.abs(state.distance) <= MODEL_WINDOW;

      return (
        <div className={styles.card}>
          <div className={styles.stage}>
            {withModel && (
              <Model
                className={styles.model}
                alt={`${node.companyName} — the product on desktop and mobile.`}
                // Closer than the carousel's 10.4: a timeline card is far
                // wider than it is tall, and the camera's vertical FOV is
                // fixed, so the old framing left the devices small in a wide
                // empty box. This fills the width without clipping the height.
                cameraPosition={{ x: 0.5, y: 0, z: 7.8 }}
                show
                showDelay={200}
                models={node.models}
              />
            )}
          </div>
          <Text className={styles.dates} size="s" secondary as="p">
            {node.dateRange}
          </Text>
          <Text className={styles.role} size="l" as="p">
            {node.title}
          </Text>
          <ul className={styles.tech} aria-hidden="true">
            {node.tech.map(tag => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      );
    },
    [visible]
  );

  const items = useMemo(() => nodes, []);

  return (
    <Section
      className={styles.experience}
      as="section"
      id={id}
      ref={sectionRef}
      aria-labelledby={titleId}
      tabIndex={-1}
      // Home.module.css keys the runway override off this: every other pane is
      // exactly one snapport tall, and this one must not be.
      data-runway
    >
      <ScrollTimeline
        className={styles.timeline}
        items={items}
        renderItem={renderItem}
        scrollContainerRef={scrollContainerRef}
        onActiveChange={onActiveChange}
        label="Work history"
        scrollRatio={0.8}
        // Cards alternate sides purely by index, which means nothing on its
        // own — but starting above would put the Senior Identity role over the
        // Staff role beside it, and two adjacent titles at the same company
        // read as a ranking whether or not one is meant.
        startSide="below"
      >
        <Heading className={styles.title} level={3} id={titleId}>
          Where I&apos;ve worked
        </Heading>

        <div className={styles.footer}>
          {/* The company name is not repeated visibly — the button below already
              carries it. This is only so the change is announced, since a link
              silently retargeting itself as the track pans is not. */}
          <VisuallyHidden aria-live="polite">
            {active.title} at {active.companyName}, {active.dateRange}
          </VisuallyHidden>
          <Button
            secondary
            className={styles.button}
            href={companyHref(active.slug)}
            icon="chevronRight"
            iconHoverShift
          >
            Read about {active.companyName}
          </Button>
        </div>
      </ScrollTimeline>
    </Section>
  );
};
