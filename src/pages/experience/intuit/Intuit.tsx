import intuitBackground from 'assets/intuit-background.png';
import intuitBackgroundPlaceholder from 'assets/intuit-background-placeholder.png';
import intuitDesignSystem from 'assets/intuit-design-system-1.png';
import intuitIdentityConsole from 'assets/intuit-identity-console-1.png';
import intuitMdlVerification from 'assets/intuit-mdl-verification.png';
import intuitPasskeyEnrollment from 'assets/intuit-passkey-enrollment.png';
import { Footer, Image, Meta } from 'components';
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
} from 'pages/experience/_shared';
import { Fragment } from 'react';
import { media } from 'utils/style';
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
            <ExperienceImage
              srcSet={[intuitDesignSystem]}
              placeholder={intuitDesignSystem}
              alt="A component library documentation site showing button variants, theme tokens, and the products that use them."
              sizes={`(max-width: ${media.mobile}px) 100vw, (max-width: ${media.tablet}px) 90vw, 80vw`}
            />
            <ExperienceTextRow>
              <ExperienceSectionHeading>
                Before Identity: the Intuit Design System
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                My first two years at Intuit were on the Design System team, building and
                maintaining 100+ reusable components used across QuickBooks, TurboTax,
                Credit Karma, and Mailchimp. I built the theming layer that let each
                product apply its own brand &mdash; colors, type, spacing &mdash; on top
                of the same shared components, so teams got consistency without giving up
                their product identity.
              </ExperienceSectionText>
              <ExperienceSectionText>
                I owned the team&apos;s Storybook as the source of truth for usage
                guidance and accessibility notes, and held weekly office hours to help
                other engineering teams integrate and adopt the library &mdash; the same
                component-first, Storybook-driven habits I carried into the Identity org
                afterward.
              </ExperienceSectionText>
              <ExperienceSectionText>
                Beyond the components themselves, I built internal Figma plugins that
                synced design tokens and component specs directly from Figma into the
                library, and piloted AI-assisted tooling to speed up the design-to-code
                handoff for partner teams. Components pulled configuration from GraphQL
                and REST endpoints with client-side instrumentation to track adoption, and
                I was the primary on-call point of contact for the design system, owning
                production support and SLAs for the products built on top of it.
              </ExperienceSectionText>
            </ExperienceTextRow>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionColumns centered className={styles.columns}>
            <div className={styles.sidebarImages}>
              <Image
                reveal
                className={styles.sidebarImage}
                srcSet={[intuitPasskeyEnrollment]}
                placeholder={intuitPasskeyEnrollment}
                alt="A confirmation screen after enrolling a passkey, showing sign-in with face, fingerprint, or PIN."
                sizes={`(max-width: ${media.mobile}px) 200px, 343px`}
              />
              <Image
                reveal
                delay={100}
                className={styles.sidebarImage}
                srcSet={[intuitMdlVerification]}
                placeholder={intuitMdlVerification}
                alt="An identity verification screen using a digital driver's license from a phone wallet."
                sizes={`(max-width: ${media.mobile}px) 200px, 343px`}
              />
            </div>
          </ExperienceSectionColumns>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <ExperienceTextRow>
              <ExperienceSectionHeading>
                Leading Passkeys across Intuit
              </ExperienceSectionHeading>
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
            </ExperienceTextRow>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>8</span>
                <ExperienceSectionText>
                  Cross-product launches shipped
                </ExperienceSectionText>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>26%</span>
                <ExperienceSectionText>
                  Of active customers on passkeys, up from 10%
                </ExperienceSectionText>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>100M+</span>
                <ExperienceSectionText>
                  Customer platform the work shipped to
                </ExperienceSectionText>
              </div>
            </div>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionContent>
            <ExperienceImage
              srcSet={[intuitIdentityConsole]}
              placeholder={intuitIdentityConsole}
              alt="An identity console showing linked partner accounts and sign-in sessions."
              sizes={`(max-width: ${media.mobile}px) 100vw, (max-width: ${media.tablet}px) 90vw, 80vw`}
            />
            <ExperienceTextRow>
              <ExperienceSectionHeading>
                Cross-identity SSO for Amazon partnerships
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                I defined and led the technical strategy for Intuit&apos;s Amazon identity
                integrations &mdash; an end-to-end initiative spanning Identity, Amazon
                Business Prime, Seller Central, and platform teams. I architected the
                first-ever cross-identity SSO pattern at Intuit for linking third-party
                accounts for partnerships; the eligibility design is now the canonical
                framework for future partnership onboarding.
              </ExperienceSectionText>
              <ExperienceSectionText>
                Owning the integration lifecycle from discovery through production across
                4+ org boundaries drove 100K+ gross new subscribers from Amazon Business
                Prime and a positive incremental activation lift from Amazon Seller
                Central, with zero escalations.
              </ExperienceSectionText>
            </ExperienceTextRow>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <ExperienceTextRow>
              <ExperienceSectionHeading>
                Agentic AI &amp; MCP-based authentication
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                I currently lead the agentic AI track for Intuit Identity, integrating
                MCP-based agent authentication. I built hands-on LLM-powered prototypes
                demonstrating agentic workflows against production identity APIs, defined
                protocol-level guidance for non-human principals, and unblocked 3 teams
                building agentic experiences on top of it.
              </ExperienceSectionText>
              <ExperienceSectionText>
                I also lead the AI-assisted engineering track for the Identity frontend
                org &mdash; running workshops and demos that introduced Claude, Claude
                Skills, agents, and agent-context-building workflows, yielding an
                estimated 3x velocity improvement for the team.
              </ExperienceSectionText>
            </ExperienceTextRow>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionContent>
            <ExperienceTextRow>
              <ExperienceSectionHeading>
                Identity 2.0, performance, and Storybook
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                I led a team of 8 engineers across backend, frontend, and product to build
                Identity 2.0 for Account Manager on a GraphQL-based architecture,
                delivering scalability improvements and an 85% GTM velocity gain, and
                setting migration SOPs with TPMs and Eng leads across products.
              </ExperienceSectionText>
              <ExperienceSectionText>
                I also led a performance track that cut P95 latency by 56% (account
                selector: 8s &rarr; 3.5s, account manager: 11s &rarr; 7.2s) through bundle
                splitting, lazy loading, and render optimization, and I maintain the
                Storybook environment across 10+ identity repositories that lets Design
                and PM partners prototype, validate, and sign off on identity experiences
                before anything ships.
              </ExperienceSectionText>
            </ExperienceTextRow>
          </ExperienceSectionContent>
        </ExperienceSection>
      </ExperienceContainer>
      <Footer />
    </Fragment>
  );
};
