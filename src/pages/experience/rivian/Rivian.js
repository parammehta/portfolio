import rivianBackground from 'assets/rivian-fleet-os-background.png';
import rivianBackgroundPlaceholder from 'assets/rivian-fleet-os-background-placeholder.png';
import rivianFleetScreen1 from 'assets/rivian-fleet-os-1.png';
import rivianFleetMobileScreen1 from 'assets/rivian-fleet-os-mobile-1.png';
import rivianFleetMobileScreen2 from 'assets/rivian-fleet-os-mobile-2.png';
import rivianFleetScreen2 from 'assets/rivian-fleet-os-2.png';
import rivianFleetScreen3 from 'assets/rivian-fleet-os-3.png';
import rivianFleetScreen4 from 'assets/rivian-fleet-os-4.png';
import { Breadcrumbs, Footer, Image, Meta } from 'components';
import {
  ExperienceBackground,
  ExperienceContainer,
  ExperienceHeader,
  ExperienceImage,
  ExperienceSection,
  ExperienceSectionColumns,
  ExperienceSectionContent,
  ExperienceSectionHeading,
  ExperienceSectionText,
  ExperienceTextRow,
} from 'layouts/Experience';
import { Fragment } from 'react';
import { media } from 'utils/style';
import styles from './Rivian.module.css';

const title = 'Senior Software Engineer at Rivian';
const description =
  'As a founding engineer on the Fleet Core team, I led the design and delivery of a cross-platform notifications system for Rivian’s fleet management software.';
const roles = [
  'Founding Engineer',
  'Full Stack',
  'Notifications Platform',
  'React + GraphQL',
];

export const Rivian = () => {
  return (
    <Fragment>
      <Meta title={title} prefix="Experiences" description={description} />
      <ExperienceContainer className={styles.slice}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Experience', href: '/#experience' },
            { label: 'Rivian', href: '/experience/rivian' },
          ]}
        />
        <ExperienceBackground
          src={rivianBackground}
          srcSet={`${rivianBackground.src} 1280w, ${rivianBackground.src} 2560w`}
          placeholder={rivianBackgroundPlaceholder}
          opacity={0.8}
        />
        <ExperienceHeader
          title={title}
          description={description}
          url="https://www.rivian.com/fleet"
          roles={roles}
        />
        <ExperienceSection padding="top">
          <ExperienceSectionContent>
            <ExperienceImage
              srcSet={[rivianFleetScreen1]}
              placeholder={rivianFleetScreen1}
              alt="The Rivian web application showing the dashboard."
              sizes={`(max-width: ${media.mobile}px) 100vw, (max-width: ${media.tablet}px) 90vw, 80vw`}
            />
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionColumns centered className={styles.columns}>
            <div className={styles.imagesText}>
              <ExperienceSectionHeading>Problem Statement</ExperienceSectionHeading>
              <ExperienceSectionText>
                Fleet operators using Rivian&apos;s software had no way to know about
                vehicle events &mdash; location changes, tire pressure warnings, sensor
                incidents &mdash; unless they were actively watching the dashboard. During
                Rivian&apos;s rapid scaling phase, I joined Fleet Core as a founding
                engineer to solve this.
              </ExperienceSectionText>
              <ExperienceSectionText>
                Our solution was a cross-platform notifications system covering push,
                email, an in-app inbox, and Slack, so fleet managers get real-time alerts
                wherever they already work.
              </ExperienceSectionText>
            </div>
            <div className={styles.sidebarImages}>
              <Image
                className={styles.sidebarImage}
                srcSet={[rivianFleetMobileScreen1]}
                placeholder={rivianFleetMobileScreen1}
                alt="The mobile notifications inbox showing recent vehicle alerts."
                sizes={`(max-width: ${media.mobile}px) 200px, 343px`}
              />
              <Image
                className={styles.sidebarImage}
                srcSet={[rivianFleetMobileScreen2]}
                placeholder={rivianFleetMobileScreen2}
                alt="A push notification for a tire pressure warning."
                sizes={`(max-width: ${media.mobile}px) 200px, 343px`}
              />
            </div>
          </ExperienceSectionColumns>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <ExperienceTextRow>
              <ExperienceSectionHeading>Implementation</ExperienceSectionHeading>
              <ExperienceSectionText>
                I led a team of 4 engineers to architect an event-driven notification
                pipeline using WebSockets, AWS SQS, and EventBridge. Vehicle events flow
                through the pipeline and fan out to whichever channel a fleet manager has
                configured, decoupling event producers from delivery so we could add new
                channels without touching the vehicle-event ingestion path.
              </ExperienceSectionText>
              <ExperienceSectionText>
                The React frontend consumed a GraphQL API, keeping delivery
                platform-agnostic across web and mobile and letting us ship the whole
                system end-to-end within the first 6 months on the team.
              </ExperienceSectionText>
            </ExperienceTextRow>
            <Image
              srcSet={[rivianFleetScreen2]}
              placeholder={rivianFleetScreen2}
              alt="The notifications settings screen for configuring alert channels."
              sizes={`(max-width: ${media.mobile}px) 500px, (max-width: ${media.tablet}px) 800px, 1000px`}
            />
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionColumns centered className={styles.columns}>
            <div className={styles.imagesText}>
              <ExperienceSectionHeading>Outcomes</ExperienceSectionHeading>
              <ExperienceSectionText>
                Fleet managers gained real-time visibility into vehicle location, tire
                pressure, and sensor incidents without needing to keep a dashboard open,
                shipped end-to-end within 6 months of the team standing up as part of
                Rivian&apos;s rapid scaling phase.
              </ExperienceSectionText>
            </div>
            <div className={styles.sidebarImages}>
              <Image
                className={styles.sidebarImage}
                srcSet={[rivianFleetScreen4]}
                placeholder={rivianFleetScreen4}
                alt="The fleet dashboard showing a vehicle location alert."
                sizes={`(max-width: ${media.mobile}px) 200px, 343px`}
              />
              <Image
                className={styles.sidebarImage}
                srcSet={[rivianFleetScreen3]}
                placeholder={rivianFleetScreen3}
                alt="A Slack notification for a sensor incident."
                sizes={`(max-width: ${media.mobile}px) 200px, 343px`}
              />
            </div>
          </ExperienceSectionColumns>
        </ExperienceSection>
      </ExperienceContainer>
      <Footer />
    </Fragment>
  );
};
