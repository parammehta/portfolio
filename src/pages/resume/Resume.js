import { useSyncExternalStore } from 'react';
import { Breadcrumbs, Button, Footer, Meta } from 'components';
import {
  ProjectContainer,
  ProjectHeader,
  ProjectSection,
  ProjectSectionContent,
} from 'layouts/Project';
import { useWindowSize } from 'hooks';
import { media } from 'utils/style';
import styles from './Resume.module.css';

const resumeUrl = '/param-mehta-resume.pdf';

// Hydration flag: false in the server snapshot, true on the client. Lets the PDF
// embed stay out of the server render — avoiding hydration mismatches with
// embedded content elements — without a setState-in-effect.
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
      <ProjectContainer className={styles.resume}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Resume', href: '/resume' },
          ]}
        />
        <ProjectHeader
          title="Resume"
          description="Software engineer with 8+ years building identity, frontend, and AI-native experiences."
        />
        <ProjectSection padding="none" className={styles.section}>
          <ProjectSectionContent>
            <div className={styles.actions}>
              <Button
                secondary
                iconHoverShift
                href={resumeUrl}
                download="param-mehta-resume.pdf"
                icon="arrowRight"
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
              >
                Open in new tab
              </Button>
            </div>

            {/* Only show viewer/fallback after client mount */}
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
          </ProjectSectionContent>
        </ProjectSection>
      </ProjectContainer>
      <Footer />
    </>
  );
};
