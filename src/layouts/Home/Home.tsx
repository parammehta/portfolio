import { useEffect, useRef, useState } from 'react';
import { Footer, Meta } from 'components';
import { Intro } from 'layouts/Home/Intro';
import { Profile } from 'layouts/Home/Profile';
import { SectionHeader } from 'layouts/Home/SectionHeader';
import { ExperienceGroup } from 'layouts/Home/ExperienceGroup';
import { ExperienceSummary } from 'layouts/Home/ExperienceSummary';
import { Skills } from 'layouts/Home/Skills';
import logoWalmart from 'assets/Walmart_Global_Tech_logo.svg?url';
const logoIntuit = '/logos/logo-intuit.svg';
const logoRivian = '/logos/logo-rivian.svg';
import intuitPasskeyEnrollment from 'assets/intuit-passkey-enrollment.png';
import intuitMdlVerification from 'assets/intuit-mdl-verification.png';
import intuitDesignSystem from 'assets/intuit-design-system-1.png';
import rivianFleetOS from 'assets/rivian-fleet-os-1.png';
import walmartSellerPage from 'assets/walmart-seller-1.png';
import walmartCoreComponents from 'assets/walmart-core-components-1.png';
import walmartBabyRegistry1 from 'assets/walmart-baby-registry-1.png';
import walmartBabyRegistry2 from 'assets/walmart-baby-registry-2.png';

import styles from './Home.module.css';

const disciplines = ['Leader', 'Mentor', 'Full-Stack', 'Coffee ☕'];

export const Home = () => {
  const [visibleSections, setVisibleSections] = useState<Element[]>([]);
  const [scrollIndicatorHidden, setScrollIndicatorHidden] = useState(false);
  const intro = useRef<HTMLElement>(null);
  const profile = useRef<HTMLElement>(null);
  const experienceHeader = useRef<HTMLElement>(null);
  const groupIntuit = useRef<HTMLElement>(null);
  const groupRivian = useRef<HTMLElement>(null);
  const groupWalmart = useRef<HTMLElement>(null);
  const experienceOne = useRef<HTMLElement>(null);
  const experienceTwo = useRef<HTMLElement>(null);
  const experienceThree = useRef<HTMLElement>(null);
  const experienceFour = useRef<HTMLElement>(null);
  const experienceFive = useRef<HTMLElement>(null);
  const experienceSix = useRef<HTMLElement>(null);
  const skills = useRef<HTMLElement>(null);

  const isVisible = (ref: React.RefObject<HTMLElement | null>) =>
    visibleSections.includes(ref.current!);

  useEffect(() => {
    const sections = [
      intro,
      profile,
      experienceHeader,
      groupIntuit,
      groupRivian,
      groupWalmart,
      experienceOne,
      experienceTwo,
      experienceThree,
      experienceFour,
      experienceFive,
      experienceSix,
      skills,
    ];

    const sectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const section = entry.target;
            observer.unobserve(section);
            if (visibleSections.includes(section)) return;
            setVisibleSections(prevSections => [...prevSections, section]);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );

    const indicatorObserver = new IntersectionObserver(
      ([entry]) => {
        setScrollIndicatorHidden(!entry.isIntersecting);
      },
      { rootMargin: '-100% 0px 0px 0px' }
    );

    sections.forEach(section => {
      sectionObserver.observe(section.current!);
    });

    indicatorObserver.observe(intro.current!);

    return () => {
      sectionObserver.disconnect();
      indicatorObserver.disconnect();
    };
  }, [visibleSections]);

  return (
    <div className={styles.home}>
      <Meta
        title="Developer + Lead"
        description="Personal website of Param Mehta – a software engineer building identity, frontend, and AI-native experiences at Intuit."
      />
      <Intro
        id="intro"
        sectionRef={intro}
        disciplines={disciplines}
        scrollIndicatorHidden={scrollIndicatorHidden}
      />
      <Profile
        sectionRef={profile}
        // eslint-disable-next-line react-hooks/refs
        visible={isVisible(profile)}
        id="profile"
      />
      <SectionHeader
        id="experience"
        sectionRef={experienceHeader}
        // eslint-disable-next-line react-hooks/refs
        visible={isVisible(experienceHeader)}
        title="Experience"
      />
      <ExperienceGroup
        id="experience-intuit"
        sectionRef={groupIntuit}
        // eslint-disable-next-line react-hooks/refs
        visible={isVisible(groupIntuit)}
        index={1}
        companyName="Intuit"
        companyLogo={logoIntuit}
      >
        <ExperienceSummary
          id="experience-1"
          sectionRef={experienceOne}
          // eslint-disable-next-line react-hooks/refs
          visible={isVisible(experienceOne)}
          dateRange="Jan 2024 – Present"
          title="Senior Software Engineer, Identity Authentication Experiences"
          description="Led Passkeys across Intuit, shipping 8 cross-product launches and driving adoption from 10% to 26% of active customers. Architected the first cross-identity SSO pattern at Intuit for Amazon partnership integrations. Currently leading the agentic AI track, building MCP-based agent authentication prototypes and running the org's AI-assisted engineering practice."
          buttonText="See Details"
          buttonLink="/experience/intuit"
          model={{
            type: 'phone',
            alt: 'A passkey enrollment confirmation and a digital ID verification screen',
            textures: [
              {
                srcSet: [intuitPasskeyEnrollment],
                placeholder: intuitPasskeyEnrollment,
              },
              {
                srcSet: [intuitMdlVerification],
                placeholder: intuitMdlVerification,
              },
            ],
          }}
        />
        <ExperienceSummary
          id="experience-2"
          alternate
          sectionRef={experienceTwo}
          // eslint-disable-next-line react-hooks/refs
          visible={isVisible(experienceTwo)}
          dateRange="Jul 2022 – Jan 2024"
          title="Software Engineer, Intuit Design System"
          description="Spent my first two years at Intuit on the Design System team, building and maintaining 100+ reusable components shared across QuickBooks, TurboTax, Credit Karma, and Mailchimp. Built a theming layer so each product could apply its own brand on top of the same components, owned the team's Storybook as the source of truth for usage and accessibility guidance, and held weekly office hours to help other teams adopt and integrate the library."
          buttonText="See Details"
          buttonLink="/experience/intuit"
          model={{
            type: 'laptop',
            alt: 'A component library documentation site showing button variants and theme tokens',
            textures: [
              {
                srcSet: [intuitDesignSystem, intuitDesignSystem],
                placeholder: intuitDesignSystem,
              },
            ],
          }}
        />
      </ExperienceGroup>
      <ExperienceGroup
        id="experience-rivian"
        sectionRef={groupRivian}
        // eslint-disable-next-line react-hooks/refs
        visible={isVisible(groupRivian)}
        index={2}
        companyName="Rivian"
        companyLogo={logoRivian}
        invertOnDark
      >
        <ExperienceSummary
          id="experience-3"
          sectionRef={experienceThree}
          // eslint-disable-next-line react-hooks/refs
          visible={isVisible(experienceThree)}
          dateRange="Jan 2022 – Jul 2022"
          title="Senior Software Engineer, Full Stack"
          description="Joined as a founding engineer on the Fleet Core team during Rivian's rapid scaling phase. Led a team of 4 engineers to design and ship a cross-platform notifications system (push, email, in-app inbox, Slack) for fleet management software, enabling real-time alerts on vehicle location, tire pressure, and sensor incidents. Architected the event-driven pipeline using WebSockets, AWS SQS, and EventBridge, with a React frontend consuming a GraphQL API."
          buttonText="See Details"
          buttonLink="/experience/rivian"
          model={{
            type: 'laptop',
            alt: 'Rivian Fleet OS',
            textures: [
              {
                srcSet: [rivianFleetOS, rivianFleetOS],
                placeholder: rivianFleetOS,
              },
            ],
          }}
        />
      </ExperienceGroup>
      <ExperienceGroup
        id="experience-walmart"
        sectionRef={groupWalmart}
        // eslint-disable-next-line react-hooks/refs
        visible={isVisible(groupWalmart)}
        index={3}
        companyName="Walmart Global Tech"
        companyLogo={logoWalmart}
        invertOnDark
      >
        <ExperienceSummary
          id="experience-4"
          alternate
          sectionRef={experienceFour}
          // eslint-disable-next-line react-hooks/refs
          visible={isVisible(experienceFour)}
          dateRange="Jan 2021 – Jan 2022"
          title="Senior Software Engineer, Marketplace & UGC"
          description="Re-platformed the 3P seller experience using GraphQL, React, TypeScript, and Next.js, serving 3.1M+ customers. Built the seller ratings and reviews page, ranked the #1 feature in Q2 2021. Architected end-to-end seller workflows across homepage, search, item page, cart, and checkout, and led holiday capacity planning and observability setup for peak traffic."
          buttonText="See Details"
          buttonLink="/experience/walmart"
          model={{
            type: 'laptop',
            alt: 'The Walmart seller experience',
            textures: [
              {
                srcSet: [walmartSellerPage, walmartSellerPage],
                placeholder: walmartSellerPage,
              },
            ],
          }}
        />
        <ExperienceSummary
          id="experience-5"
          sectionRef={experienceFive}
          // eslint-disable-next-line react-hooks/refs
          visible={isVisible(experienceFive)}
          dateRange="Jan 2020 – Jan 2021"
          title="Software Engineer, Walmart Core Components"
          description="Spent my first year on Marketplace & UGC embedded in the Core Components team, which builds and manages the shared component library used across Walmart.com, Sam's Club, and Marketplace. Built and maintained 100+ reusable components with a theming layer for different Walmart banners, owned the team's Storybook, and held office hours to help other engineering teams integrate components correctly."
          buttonText="See Details"
          buttonLink="/experience/walmart"
          model={{
            type: 'laptop',
            alt: 'A component library documentation site showing button variants and theme tokens for Walmart.com and Sam\'s Club',
            textures: [
              {
                srcSet: [walmartCoreComponents, walmartCoreComponents],
                placeholder: walmartCoreComponents,
              },
            ],
          }}
        />
        <ExperienceSummary
          id="experience-6"
          alternate
          sectionRef={experienceSix}
          // eslint-disable-next-line react-hooks/refs
          visible={isVisible(experienceSix)}
          dateRange="Jun 2018 – Jan 2020"
          title="Software Engineer, Wireless Verticals & Baby Registry"
          description="Launched Walmart Baby Registry, reaching 100K new registrants within 30 days, and was on the first team at Walmart to adopt TypeScript, earning the internal Tech Evangelist Award. Optimized the PDP buy-box to improve page speed by 15%, generating a 30bps conversion rate lift."
          buttonText="See Details"
          buttonLink="/experience/walmart"
          model={{
            type: 'phone',
            alt: 'Walmart Baby Registry',
            textures: [
              {
                srcSet: [walmartBabyRegistry1],
                placeholder: walmartBabyRegistry1,
              },
              {
                srcSet: [walmartBabyRegistry2],
                placeholder: walmartBabyRegistry2,
              },
            ],
          }}
        />
      </ExperienceGroup>
      <Skills
        id="skills"
        sectionRef={skills}
        // eslint-disable-next-line react-hooks/refs
        visible={isVisible(skills)}
      />
      <Footer />
    </div>
  );
};
