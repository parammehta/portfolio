import intuitBackground from 'assets/intuit-background.png';
import intuitBackgroundPlaceholder from 'assets/intuit-background-placeholder.png';
import intuitDesignSystem from 'assets/intuit-design-system-1.png';
import intuitIdentityConsole from 'assets/intuit-identity-console-1.png';
import intuitMdlVerification from 'assets/intuit-mdl-verification.png';
import intuitPasskeyEnrollment from 'assets/intuit-passkey-enrollment.png';
import { Footer, Meta } from 'components';
import {
  ExperienceBackground,
  ExperienceContainer,
  ExperienceDevices,
  ExperienceHeader,
  ExperienceSection,
  ExperienceSectionColumns,
  ExperienceSectionContent,
  ExperienceSectionHeading,
  ExperienceSectionText,
  laptopModel,
  phoneModels,
} from 'pages/experience/_shared';
import { Fragment } from 'react';
import styles from './Intuit.module.css';

const title = 'Staff Software Engineer at Intuit';
const description =
  'Built and scaled the Intuit Design System — 100+ components, Figma plugins, and AI-assisted tooling adopted across QuickBooks, TurboTax, Credit Karma, and Mailchimp — before leading passkey adoption and agentic AI prototyping for Intuit’s Identity Authentication Experiences team.';
const roles = [
  'Design Systems',
  'Identity & Auth',
  'AI/MCP Prototyping',
  'Team Leadership',
];

const designSystemStats = [
  { value: '2 yrs', label: 'On the Design System team' },
  { value: '100+', label: 'Reusable components' },
  { value: '4', label: 'Products on the library' },
];

const passkeyStats = [
  { value: '8', label: 'Cross-product launches shipped' },
  { value: '26%', label: 'Of active customers on passkeys, up from 10%' },
  { value: '100M+', label: 'Customer platform the work shipped to' },
];

const ssoStats = [
  { value: '4+', label: 'Org boundaries spanned' },
  { value: '100K+', label: 'Gross new subscribers from Amazon Business Prime' },
  { value: '0', label: 'Escalations' },
];

const identity20Stats = [
  { value: '85%', label: 'GTM velocity gain from the Identity 2.0 migration' },
];

/** One per subject in the section heading, each already stated in its copy. */
const performanceStats = [
  { value: '56%', label: 'P95 latency cut across the identity surfaces' },
  { value: '10+', label: 'Identity repositories on the Storybook environment' },
];

export const Intuit = () => {
  return (
    <Fragment>
      <Meta title={title} prefix="Experiences" description={description} />
      <ExperienceContainer className={styles.intuit}>
        <ExperienceBackground
          src={intuitBackground}
          srcSet={`${intuitBackground.src} 1280w, ${intuitBackground.src} 2560w`}
          placeholder={intuitBackgroundPlaceholder}
          opacity={0.8}
        />
        <ExperienceHeader
          title={title}
          description={description}
          roles={roles}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Experience', href: '/experience' },
            { label: 'Intuit', href: '/experience/intuit' },
          ]}
        />
        <ExperienceSection padding="top" light>
          <ExperienceSectionContent>
            <ExperienceDevices
              device="laptop"
              side="right"
              alt="A component library documentation site showing button variants, theme tokens, and the products that use them."
              heading={<>Before Identity: the Intuit Design System</>}
              models={laptopModel(intuitDesignSystem)}
              aside={
                <div className={styles.deviceStats}>
                  {designSystemStats.map(stat => (
                    <div className={styles.stat} key={stat.label}>
                      <span className={styles.deviceStatNumber}>{stat.value}</span>
                      <ExperienceSectionText size="s">{stat.label}</ExperienceSectionText>
                    </div>
                  ))}
                </div>
              }
            >
              <ExperienceSectionText>
                My first two years at Intuit were on the Design System team, building and
                maintaining 100+ reusable components used across QuickBooks, TurboTax,
                Credit Karma, and Mailchimp. I built the theming layer that let each
                product apply its own brand &mdash; colors, type, spacing &mdash; on top
                of the same shared components, so teams got consistency without giving up
                their product identity.
              </ExperienceSectionText>
            </ExperienceDevices>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionColumns width="xl" className={styles.identityColumns}>
            <div className={styles.identityColumn}>
              <ExperienceSectionHeading>
                Storybook &amp; office hours
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                I owned the team&apos;s Storybook as the source of truth for usage
                guidance and accessibility notes, and held weekly office hours to help
                other engineering teams integrate and adopt the library &mdash; the same
                component-first, Storybook-driven habits I carried into the Identity org
                afterward.
              </ExperienceSectionText>
            </div>
            <div className={styles.identityColumn}>
              <ExperienceSectionHeading>
                Figma tooling &amp; on-call
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                Beyond the components themselves, I built internal Figma plugins that
                synced design tokens and component specs directly from Figma into the
                library, and piloted AI-assisted tooling to speed up the design-to-code
                handoff for partner teams. Components pulled configuration from GraphQL
                and REST endpoints with client-side instrumentation to track adoption, and
                I was the primary on-call point of contact for the design system, owning
                production support and SLAs for the products built on top of it.
              </ExperienceSectionText>
            </div>
          </ExperienceSectionColumns>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <ExperienceDevices
              device="phone"
              side="left"
              className={styles.passkeyDense}
              alt="A passkey enrollment confirmation screen, and an identity verification screen using a digital driver's license from a phone wallet."
              heading={<>Leading Passkeys across Intuit</>}
              models={phoneModels(intuitPasskeyEnrollment, intuitMdlVerification)}
              aside={
                <div className={styles.deviceStats}>
                  {passkeyStats.map(stat => (
                    <div className={styles.stat} key={stat.label}>
                      <span className={styles.deviceStatNumber}>{stat.value}</span>
                      <ExperienceSectionText size="s">{stat.label}</ExperienceSectionText>
                    </div>
                  ))}
                </div>
              }
            >
              <ExperienceSectionText>
                I led the passkeys initiative across Intuit, architecting and shipping 8
                cross-product frontend launches with a team of 5 engineers &mdash;
                streamlined registration, post-enrollment education, and a centralized
                post-auth surface for managing sign-in methods.
              </ExperienceSectionText>
              <ExperienceSectionText>
                The rollout drove passkey adoption from 10% to 26% of active Intuit
                customers, meaningfully strengthening Intuit&apos;s phishing-resistant
                authentication posture across the platform.
              </ExperienceSectionText>
              <ExperienceSectionText>
                Alongside passkeys, I shipped digital ID (mDL) verification, letting
                customers prove their identity with the driver&apos;s license or ID
                already saved in their phone&apos;s wallet instead of manually uploading a
                document photo &mdash; a faster path through identity verification with
                fewer drop-offs.
              </ExperienceSectionText>
            </ExperienceDevices>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <ExperienceDevices
              device="laptop"
              side="right"
              alt="An identity console showing linked partner accounts and sign-in sessions."
              heading={<>Cross-identity SSO for Amazon partnerships</>}
              models={laptopModel(intuitIdentityConsole)}
              aside={
                <div className={styles.deviceStats}>
                  {ssoStats.map(stat => (
                    <div className={styles.stat} key={stat.label}>
                      <span className={styles.deviceStatNumber}>{stat.value}</span>
                      <ExperienceSectionText size="s">{stat.label}</ExperienceSectionText>
                    </div>
                  ))}
                </div>
              }
            >
              <ExperienceSectionText>
                I built Intuit&apos;s first cross-identity SSO: QuickBooks embedded
                directly inside Amazon&apos;s domain, with Intuit authentication handled
                cross-domain so a seller never leaves Amazon to sign in. Getting an
                identity provider to work from inside someone else&apos;s origin is the
                hard part &mdash; the eligibility design that came out of it is now the
                canonical framework for onboarding future partnerships.
              </ExperienceSectionText>
              <ExperienceSectionText>
                Owning the integration lifecycle from discovery through production across
                4+ org boundaries drove 100K+ gross new subscribers from Amazon Business
                Prime and a positive incremental activation lift from Amazon Seller
                Central, with zero escalations.
              </ExperienceSectionText>
            </ExperienceDevices>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionColumns width="xl" className={styles.identityColumns}>
            <div className={styles.identityColumn}>
              <ExperienceSectionHeading>Agentic AI &amp; MCP</ExperienceSectionHeading>
              <ExperienceSectionText>
                I currently lead the agentic AI track for Intuit Identity, integrating
                MCP-based agent authentication. I built hands-on LLM-powered prototypes
                demonstrating agentic workflows against production identity APIs, defined
                protocol-level guidance for non-human principals, and unblocked 3 teams
                building agentic experiences on top of it.
              </ExperienceSectionText>
            </div>
            <div className={styles.identityColumn}>
              <ExperienceSectionHeading>AI-assisted engineering</ExperienceSectionHeading>
              <ExperienceSectionText>
                I also lead the AI-assisted engineering track for the Identity frontend
                org &mdash; running workshops and demos that introduced Claude, Claude
                Skills, agents, and agent-context-building workflows, yielding an
                estimated 3x velocity improvement for the team.
              </ExperienceSectionText>
            </div>
          </ExperienceSectionColumns>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionColumns width="xl" className={styles.identityColumns}>
            <div className={styles.identityColumn}>
              <ExperienceSectionHeading>
                Identity 2.0: the GraphQL migration
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                For Identity 2.0 I migrated 40 REST endpoints spanning 20 signup and
                account-manager flows onto GraphQL, leading 8 engineers across backend,
                frontend, and product through it. Collapsing that many flows onto one
                schema is what bought the scalability headroom and an 85% GTM velocity
                gain, and the migration SOPs we set became the pattern other products
                followed.
              </ExperienceSectionText>
              <div className={styles.stats}>
                {identity20Stats.map(stat => (
                  <div className={styles.stat} key={stat.label}>
                    <span className={styles.statNumber}>{stat.value}</span>
                    <ExperienceSectionText>{stat.label}</ExperienceSectionText>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.identityColumn}>
              <ExperienceSectionHeading>
                Performance Improvements
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                I also led a performance track that cut P95 latency by 56% (account
                selector: 8s &rarr; 3.5s, account manager: 11s &rarr; 7.2s) through bundle
                splitting, lazy loading, and render optimization, and I maintain the
                Storybook environment across 10+ identity repositories that lets Design
                and PM partners prototype, validate, and sign off on identity experiences
                before anything ships.
              </ExperienceSectionText>
              <div className={styles.stats}>
                {performanceStats.map(stat => (
                  <div className={styles.stat} key={stat.label}>
                    <span className={styles.statNumber}>{stat.value}</span>
                    <ExperienceSectionText>{stat.label}</ExperienceSectionText>
                  </div>
                ))}
              </div>
            </div>
          </ExperienceSectionColumns>
        </ExperienceSection>
        <Footer />
      </ExperienceContainer>
    </Fragment>
  );
};
