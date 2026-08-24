// These four are WebP data — the source files were mislabeled with a .png
// extension for years; renamed to match their actual encoding.
import rivianBackground from 'assets/rivian-fleet-os-background.webp';
import rivianBackgroundPlaceholder from 'assets/rivian-fleet-os-background-placeholder.png';
import rivianFleetScreen1 from 'assets/rivian-fleet-os-1.png';
import rivianFleetMobileScreen1 from 'assets/rivian-fleet-os-mobile-1.png';
import rivianFleetMobileScreen2 from 'assets/rivian-fleet-os-mobile-2.png';
import rivianFleetScreen2 from 'assets/rivian-fleet-os-2.webp';
import rivianFleetScreen3 from 'assets/rivian-fleet-os-3.webp';
import rivianFleetScreen4 from 'assets/rivian-fleet-os-4.webp';
import { Footer, Meta } from 'components';
import {
  ExperienceBackground,
  ExperienceContainer,
  ExperienceDevices,
  ExperienceHeader,
  ExperienceSection,
  ExperienceSectionContent,
  ExperienceSectionText,
  laptopModel,
  laptopModels,
  phoneModels,
} from 'pages/experience/_shared';
import { Fragment } from 'react';

const title = 'Senior Software Engineer at Rivian';
const description =
  "As a founding engineer on the Fleet Core team, I led the design and delivery of a cross-platform notifications system for Rivian's fleet management software.";
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
      <ExperienceContainer>
        <ExperienceBackground
          src={rivianBackground}
          srcSet={`${rivianBackground.src} 1280w, ${rivianBackground.src} 2560w`}
          placeholder={rivianBackgroundPlaceholder}
          opacity={0.8}
        />
        <ExperienceHeader
          title={title}
          description={description}
          roles={roles}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Experience', href: '/experience' },
            { label: 'Rivian', href: '/experience/rivian' },
          ]}
        />
        <ExperienceSection padding="top">
          <ExperienceSectionContent>
            <ExperienceDevices
              device="laptop"
              side="right"
              alt="The Rivian web application showing the fleet dashboard."
              heading={<>Problem Statement</>}
              models={laptopModel(rivianFleetScreen1)}
            >
              <ExperienceSectionText>
                Fleet operators using Rivian&apos;s software had no way to know about
                vehicle events &mdash; location changes, tire pressure warnings, sensor
                incidents &mdash; unless they were actively watching the dashboard. During
                Rivian&apos;s rapid scaling phase, I joined Fleet Core as a founding
                engineer to solve this.
              </ExperienceSectionText>
            </ExperienceDevices>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <ExperienceDevices
              device="phone"
              side="left"
              alt="The mobile notifications inbox showing recent vehicle alerts, and a push notification for a tire pressure warning."
              models={phoneModels(rivianFleetMobileScreen1, rivianFleetMobileScreen2)}
            >
              <ExperienceSectionText>
                Our solution was a cross-platform notifications system covering push,
                email, an in-app inbox, and Slack, so fleet managers get real-time alerts
                wherever they already work.
              </ExperienceSectionText>
            </ExperienceDevices>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionContent>
            <ExperienceDevices
              device="laptop"
              side="right"
              alt="The notifications settings screen for configuring alert channels."
              heading={<>Implementation</>}
              models={laptopModel(rivianFleetScreen2)}
            >
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
            </ExperienceDevices>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <ExperienceDevices
              device="laptop"
              side="left"
              alt="The fleet dashboard showing a vehicle location alert, and a Slack notification for a sensor incident."
              heading={<>Outcomes</>}
              models={laptopModels(rivianFleetScreen4, rivianFleetScreen3)}
            >
              <ExperienceSectionText>
                Fleet managers gained real-time visibility into vehicle location, tire
                pressure, and sensor incidents without needing to keep a dashboard open,
                shipped end-to-end within 6 months of the team standing up as part of
                Rivian&apos;s rapid scaling phase.
              </ExperienceSectionText>
            </ExperienceDevices>
          </ExperienceSectionContent>
        </ExperienceSection>
        <Footer />
      </ExperienceContainer>
    </Fragment>
  );
};
