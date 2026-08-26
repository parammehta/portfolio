import { type RefObject, useCallback, useMemo, useState } from 'react';
import { Button, Heading, Section, Text, VisuallyHidden } from 'refract-ui';
import { ScrollTimeline, type ScrollTimelineItem } from 'refract-ui';
import { Model } from 'refract-ui/model';
import intuitDesignSystem from 'assets/intuit-design-system-1.png';
import intuitPasskeyEnrollment from 'assets/intuit-passkey-enrollment.png';
import rivianFleetOs from 'assets/rivian-fleet-os-1.png';
import walmartHome from 'assets/walmart-home-1.png';
import walmartCoreComponents from 'assets/walmart-core-components-1.png';
import walmartBabyRegistry from 'assets/walmart-baby-registry-1.png';
import { companies, type CompanySlug, companyHref } from 'data/experience';
import { laptopModel, phoneModel } from 'pages/experience/_shared';
import { analyticsEvents, trackEvent } from 'utils/analytics';
import styles from './ExperienceTimeline.module.css';

/**
 * One device per card, keyed by role rather than by company — each role gets the
 * shot of its *own* work, not a screenshot shared across the company.
 *
 * Which device follows the work: passkey enrollment and Baby Registry were phone
 * flows, a design system and a fleet dashboard are desktop. This matches how the
 * matching `/experience` section frames each one, so the two pages agree.
 *
 * A role added to `data/experience` without an entry here renders no model, and
 * fails the integration test that walks every role — which is the intended guard.
 */
const screens: Record<string, { device: 'laptop' | 'phone'; src: { src: string } }> = {
  'intuit-design-system': { device: 'laptop', src: intuitDesignSystem },
  'intuit-identity': { device: 'phone', src: intuitPasskeyEnrollment },
  'rivian-fleet-core': { device: 'laptop', src: rivianFleetOs },
  'walmart-marketplace': { device: 'laptop', src: walmartHome },
  'walmart-core-components': { device: 'laptop', src: walmartCoreComponents },
  'walmart-baby-registry': { device: 'phone', src: walmartBabyRegistry },
};

/**
 * Framing per device, for a card far wider than it is tall. The camera's
 * vertical FOV is fixed, so distance alone sets how much of the scene shows:
 * each of these is as close as that device gets before the short card height
 * starts clipping it.
 */
const cameraPositions = {
  laptop: { x: 0, y: 0, z: 5.1 },
  phone: { x: 0, y: 0, z: 6.4 },
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
  device: 'laptop' | 'phone';
  models: ReturnType<typeof laptopModel>;
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
    device: screens[role.id]?.device ?? 'laptop',
    models:
      screens[role.id]?.device === 'phone'
        ? phoneModel(screens[role.id].src)
        : laptopModel(screens[role.id].src),
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
                alt={`${node.title} at ${node.companyName}.`}
                cameraPosition={cameraPositions[node.device]}
                show
                showDelay={200}
                models={node.models}
              />
            )}
          </div>
          {/* Not `secondary`: that sets colour via `[data-secondary]`, which
              outranks this class and would drop the accent tint on the floor. */}
          <Text className={styles.dates} size="s" as="p">
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
        // own — but the first two nodes are the same company's Staff and Senior
        // roles, and two adjacent titles at one employer read as a ranking
        // whether or not one is meant. Starting above keeps Staff on top.
        startSide="above"
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
