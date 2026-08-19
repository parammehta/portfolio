import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import intuitThumbnail from 'assets/intuit-background.png';
import intuitThumbnailPlaceholder from 'assets/intuit-background-placeholder.png';
import rivianThumbnail from 'assets/rivian-fleet-os-background.webp';
import rivianThumbnailPlaceholder from 'assets/rivian-fleet-os-background-placeholder.png';
import walmartThumbnail from 'assets/walmart-background.png';
import walmartThumbnailPlaceholder from 'assets/walmart-background-placeholder.png';
import { Button, Divider, Heading, Image, Meta, Text, ViewportPage } from 'components';
import {
  TAB_HIGHLIGHT_LIMIT,
  TAB_TECH_LIMIT,
  companies,
  companyHref,
  type CompanySlug,
} from 'data/experience';
import { analyticsEvents, trackEvent } from 'utils/analytics';
import { cssProps, media } from 'utils/style';
import styles from './ExperienceIndex.module.css';

const thumbnails: Record<CompanySlug, { src: typeof intuitThumbnail; placeholder: typeof intuitThumbnailPlaceholder }> = {
  intuit: { src: intuitThumbnail, placeholder: intuitThumbnailPlaceholder },
  rivian: { src: rivianThumbnail, placeholder: rivianThumbnailPlaceholder },
  walmart: { src: walmartThumbnail, placeholder: walmartThumbnailPlaceholder },
};

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Experience', href: '/experience' },
];

export const ExperienceIndex = () => {
  const id = useId();
  // Index rather than slug so the initial render is identical on the server and
  // the client — the static export would otherwise hydrate against a guess.
  const [currentIndex, setCurrentIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Both axes: the rail is a vertical column on desktop and a horizontal strip
  // below tablet, and CSS picks the pair it needs for the current breakpoint.
  const [marker, setMarker] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  }>();

  const company = companies[currentIndex];

  // Track the selected tab's box so the rail marker follows it. A ResizeObserver
  // rather than a one-off measure because the labels reflow at every breakpoint.
  useEffect(() => {
    const currentTab = tabRefs.current[currentIndex];
    if (!currentTab) return;

    const measure = () =>
      setMarker({
        top: currentTab.offsetTop,
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
        height: currentTab.offsetHeight,
      });

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(currentTab);

    return () => resizeObserver.disconnect();
  }, [currentIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { length } = companies;
    const prevIndex = (currentIndex - 1 + length) % length;
    const nextIndex = (currentIndex + 1) % length;

    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      setCurrentIndex(prevIndex);
      tabRefs.current[prevIndex]?.focus();
    } else if (['ArrowRight', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      setCurrentIndex(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      setCurrentIndex(0);
      tabRefs.current[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      setCurrentIndex(length - 1);
      tabRefs.current[length - 1]?.focus();
    }
  };

  return (
    <ViewportPage title="Experience" breadcrumbs={breadcrumbs}>
      <Meta
        title="Experience"
        description="Where Param Mehta has worked — identity and authentication at Intuit, fleet software at Rivian, and marketplace and design systems at Walmart Global Tech."
      />
      <div className={styles.layout}>
        <div
          className={styles.rail}
          role="tablist"
          aria-label="Companies"
          aria-orientation="vertical"
          onKeyDown={handleKeyDown}
        >
          <div
            className={styles.marker}
            data-visible={!!marker}
            style={
              marker &&
              cssProps({
                top: marker.top,
                left: marker.left,
                width: marker.width,
                height: marker.height,
              })
            }
            aria-hidden
          />
          {companies.map((item, index) => (
            <button
              key={item.slug}
              type="button"
              role="tab"
              id={`${id}-tab-${item.slug}`}
              aria-selected={index === currentIndex}
              aria-controls={`${id}-panel-${item.slug}`}
              aria-label={item.shortName}
              tabIndex={index === currentIndex ? 0 : -1}
              ref={element => {
                tabRefs.current[index] = element;
              }}
              className={styles.tab}
              onClick={() => {
                trackEvent(analyticsEvents.experienceTabSelect, { company: item.slug });
                setCurrentIndex(index);
              }}
            >
              {item.shortName}
              <span className={styles.tabDate} aria-hidden>
                {item.dateRange}
              </span>
            </button>
          ))}
        </div>

        <div
          className={styles.panel}
          role="tabpanel"
          id={`${id}-panel-${company.slug}`}
          aria-labelledby={`${id}-tab-${company.slug}`}
          tabIndex={0}
        >
          {!!company.stats.length && (
            <ul className={styles.stats}>
              {company.stats.map(stat => (
                <li className={styles.stat} key={stat.label}>
                  <Text className={styles.statValue} as="div">
                    {stat.value}
                  </Text>
                  <Text className={styles.statLabel} secondary as="div">
                    {stat.label}
                  </Text>
                </li>
              ))}
            </ul>
          )}

          {company.roles.map((role, index) => (
            <article className={styles.role} key={role.id}>
              {index > 0 && <Divider className={styles.divider} notch={false} light />}
              <Heading level={5} as="h2" className={styles.roleTitle}>
                {role.title}
              </Heading>
              <Text className={styles.dateRange} secondary as="div">
                {role.dateRange}
              </Text>
              <Text className={styles.highlights} as="div">
                <ul>
                  {role.highlights.slice(0, TAB_HIGHLIGHT_LIMIT).map(highlight => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </Text>
              <ul className={styles.techRow}>
                {role.tech.slice(0, TAB_TECH_LIMIT).map(tech => (
                  <li className={styles.techChip} key={tech}>
                    {tech}
                  </li>
                ))}
              </ul>
            </article>
          ))}

          <div className={styles.actionRow}>
            <Image
              className={styles.actionThumbnail}
              src={thumbnails[company.slug].src}
              placeholder={thumbnails[company.slug].placeholder}
              alt=""
              role="presentation"
              sizes={`(max-width: ${media.mobile}px) 96px, 120px`}
            />
            <Button
              iconHoverShift
              href={companyHref(company.slug)}
              iconEnd="arrowRight"
              onClick={() =>
                trackEvent(analyticsEvents.experienceDetailsClick, { company: company.slug })
              }
            >
              See Details
            </Button>
          </div>
        </div>
      </div>
    </ViewportPage>
  );
};
