import { useSyncExternalStore } from 'react';
import { Button, Footer, Meta } from 'components';
import {
  PageContainer,
  PageHeader,
  PageSection,
  PageSectionContent,
} from 'components/Page';
import { useWindowSize } from 'hooks';
import { analyticsEvents, trackEvent } from 'utils/analytics';
import { media } from 'utils/style';
import styles from './Resume.module.css';

const resumeUrl = '/param-mehta-resume.pdf';

const subscribeToNothing = () => () => {};
const getMountedSnapshot = () => true;
const getServerSnapshot = () => false;

export const Resume = () => {
  const { width } = useWindowSize();
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    getMountedSnapshot,
    getServerSnapshot
  );

  const isMobile = width > 0 && width <= media.tablet;

  return (
    <>
      <Meta
        title="Resume"
        description="Resume of Param Mehta — senior software engineer specialising in identity, frontend, and AI-native experiences."
      />
      <PageContainer className={styles.resume}>
        <PageHeader
          title="Resume"
          description="Software engineer with 8+ years building identity, frontend, and AI-native experiences."
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
            </div>

            {mounted && (
              isMobile ? (
                <div className={styles.mobileFallback}>
                  <p className={styles.mobileText}>
                    PDF preview isn&apos;t available on mobile. Download or open the
                    resume using the buttons above.
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
              )
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
      <Footer />
    </>
  );
};
