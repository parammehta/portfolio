import { useSyncExternalStore } from 'react';
import { Footer, Meta } from 'components';
import { Button } from 'refract-ui';
import { PageHeader, PageSection, PageSectionContent } from 'components/Page';
import { analyticsEvents, trackEvent } from 'utils/analytics';
import { media } from 'utils/style';
import styles from './Resume.module.css';

const resumeUrl = '/param-mehta-resume.pdf';
const storybookUrl = 'https://storybook.parammehta.com';

// Driven by matchMedia rather than `useWindowSize` (which seeds a guessed
// 1280×800 until its resize listener fires): a mobile visitor could hit that
// guessed-desktop state before the real width arrives, mounting the PDF
// iframe and starting an unwanted fetch that then gets torn down.
// `useSyncExternalStore` re-checks its client snapshot synchronously before
// paint, so this can't flash the wrong branch after hydration; `null` on the
// server keeps the existing behaviour of rendering neither branch until the
// client knows the real answer.
const mobileQuery = `(max-width: ${media.tablet}px)`;

function subscribeToMobileQuery(callback: () => void) {
  const mql = window.matchMedia(mobileQuery);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getIsMobileSnapshot(): boolean {
  return window.matchMedia(mobileQuery).matches;
}

function getServerSnapshot(): boolean | null {
  return null;
}

export const Resume = () => {
  const isMobile = useSyncExternalStore(
    subscribeToMobileQuery,
    getIsMobileSnapshot,
    getServerSnapshot
  );

  return (
    <>
      <Meta
        title="Resume"
        description="Resume of Param Mehta — full-stack web engineer specialising in frontend architecture, design systems, and AI-native experiences."
      />
      <PageHeader
        title="Resume"
        description="Full-stack web engineer with 8+ years building product, design system, and AI-native experiences — including the design system below."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resume', href: '/resume' },
        ]}
      />
      <PageSection padding="none" className={styles.section}>
        <PageSectionContent>
          <div className={styles.actions}>
            <Button
              secondary
              iconHoverShift
              href={resumeUrl}
              download="param-mehta-resume.pdf"
              icon="download"
              onClick={() => trackEvent(analyticsEvents.resumeDownload)}
            >
              Download PDF
            </Button>
            <Button
              secondary
              iconHoverShift
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              icon="link"
              onClick={() => trackEvent(analyticsEvents.resumeOpen)}
            >
              Open in new tab
            </Button>
            <Button
              secondary
              iconHoverShift
              href={storybookUrl}
              target="_blank"
              rel="noopener noreferrer"
              icon="storybook"
              onClick={() => trackEvent(analyticsEvents.designSystemOpen)}
            >
              Design system
            </Button>
          </div>

          {isMobile !== null &&
            (isMobile ? (
              <div className={styles.mobileFallback}>
                <p className={styles.mobileText}>
                  PDF preview isn&apos;t available on mobile. Download or open the resume
                  using the buttons above.
                </p>
              </div>
            ) : (
              <div className={styles.viewerFrame}>
                <iframe
                  src={`${resumeUrl}#toolbar=0&navpanes=0`}
                  className={styles.viewer}
                  title="Resume PDF"
                />
              </div>
            ))}
        </PageSectionContent>
      </PageSection>
      <Footer />
    </>
  );
};
