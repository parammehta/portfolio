import backgroundWalmartPlaceholder from 'assets/walmart-background-placeholder.png';
import backgroundWalmart from 'assets/walmart-background.png';
import walmartHome1 from 'assets/walmart-home-1.png';
import walmartHome2 from 'assets/walmart-home-2.png';
import walmartMobileSeller1 from 'assets/walmart-mobile-seller-1.png';
import walmartMobileSeller2 from 'assets/walmart-mobile-seller-2.png';
import walmartProduct1 from 'assets/walmart-product-1.png';
import walmartSeller1 from 'assets/walmart-seller-1.png';
import walmartSeller2 from 'assets/walmart-seller-2.png';
import walmartBabyRegistry1 from 'assets/walmart-baby-registry-1.png';
import walmartBabyRegistry2 from 'assets/walmart-baby-registry-2.png';
import walmartCoreComponents from 'assets/walmart-core-components-1.png';
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
import styles from './Walmart.module.css';

const title = 'Senior Software Engineer at Walmart';
const description =
  'I re-platformed Walmart\'s 3P seller experience on GraphQL, React, and Next.js, then went on to launch Walmart Baby Registry earlier in my time on Marketplace & UGC.';
const roles = ['Full Stack', 'Design Systems', 'React + GraphQL', 'Next.js'];

export const Walmart = () => {
  return (
    <Fragment>
      <ExperienceContainer className={styles.walmart}>
        <Meta title={title} prefix="Experiences" description={description} />
        <ExperienceBackground
          opacity={0.5}
          src={backgroundWalmart}
          srcSet={`${backgroundWalmart.src} 1080w, ${backgroundWalmart.src} 2160w`}
          placeholder={backgroundWalmartPlaceholder}
        />
        <ExperienceHeader
          title={title}
          description={description}
          roles={roles}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Experience', href: '/experience' },
            { label: 'Walmart', href: '/experience/walmart' },
          ]}
        />
        <ExperienceSection padding="top">
          <ExperienceSectionContent>
            <ExperienceImage
              raised
              srcSet={[walmartHome1, walmartHome2]}
              placeholder={walmartHome1}
              sizes={`(max-width: ${media.mobile}px) 100vw, (max-width: ${media.tablet}px) 800px, 1000px`}
              alt="The Walmart marketplace seller experience homepage."
            />
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <Image
              raised
              srcSet={[walmartCoreComponents]}
              placeholder={walmartCoreComponents}
              alt="A component library documentation site showing button variants, theme tokens, and the products that use them."
              sizes={`(max-width: ${media.mobile}px) 100vw, (max-width: ${media.tablet}px) 800px, 1000px`}
            />
            <ExperienceTextRow>
              <ExperienceSectionHeading>
                First stop: the Core Components team
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                I spent my first year on Marketplace &amp; UGC embedded in Walmart&apos;s
                Core Components team, which builds and manages the shared component
                library used across Walmart.com, Sam&apos;s Club, and Marketplace. I built
                and maintained 100+ reusable components with a theming layer so different
                Walmart banners could reuse the same components with their own visual
                treatment.
              </ExperienceSectionText>
              <ExperienceSectionText>
                I owned the team&apos;s Storybook as the documentation and visual QA tool
                for the library, and held office hours to help other engineering teams
                integrate components correctly &mdash; habits I carried into the seller
                re-platform work that followed.
              </ExperienceSectionText>
            </ExperienceTextRow>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceTextRow>
            <ExperienceSectionHeading>
              Re-platforming the 3P seller experience
            </ExperienceSectionHeading>
            <ExperienceSectionText>
              On the Marketplace &amp; User Generated Content team, I led the re-platform
              of Walmart&apos;s third-party seller experience onto GraphQL, React,
              TypeScript, and Next.js &mdash; serving 3.1M+ customers. I architected
              end-to-end seller workflows across the homepage, search, item page, cart,
              and checkout with multiple product and platform teams, and led holiday
              capacity planning and observability setup for peak traffic.
            </ExperienceSectionText>
          </ExperienceTextRow>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <Image
              raised
              srcSet={[walmartSeller1, walmartSeller2]}
              placeholder={walmartSeller1}
              alt="The seller ratings and reviews page on a product listing."
              sizes="100vw"
            />
            <ExperienceTextRow>
              <ExperienceSectionHeading>
                Seller ratings and reviews
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                I built the seller ratings and reviews page, which was ranked the #1
                feature on the marketplace roadmap in Q2 2021 &mdash; giving buyers trust
                signals about third-party sellers before checking out.
              </ExperienceSectionText>
            </ExperienceTextRow>
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionColumns centered className={styles.columns}>
            <div className={styles.imagesText}>
              <ExperienceSectionHeading>
                ADA-compliant star ratings
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                I redesigned the star-rating component for ADA compliance, reducing its
                bundle size by 10% and improving rendering performance across the product
                and purchase review flows it appeared in &mdash; built once and shipped
                consistently across both the Walmart.com desktop site and mobile web.
              </ExperienceSectionText>
            </div>
            <div className={styles.sidebarImages}>
              <Image
                className={styles.sidebarImage}
                srcSet={[walmartMobileSeller1]}
                placeholder={walmartMobileSeller1}
                alt="The mobile product page showing the redesigned star rating."
                sizes={`(max-width: ${media.mobile}px) 200px, 343px`}
              />
              <Image
                className={styles.sidebarImage}
                srcSet={[walmartMobileSeller2]}
                placeholder={walmartMobileSeller2}
                alt="The mobile review submission flow."
                sizes={`(max-width: ${media.mobile}px) 200px, 343px`}
              />
            </div>
          </ExperienceSectionColumns>
        </ExperienceSection>
        <ExperienceSection light>
          <ExperienceSectionContent>
            <ExperienceTextRow>
              <ExperienceSectionHeading>
                Seller communication and tooling
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                I independently built an internal email routing system for sellers,
                eliminating the dependency on external email clients, unifying the
                seller/buyer communication experience, and adding email masking for
                privacy and security.
              </ExperienceSectionText>
              <ExperienceSectionText>
                I also standardized the linting and formatting toolchain (ESLint,
                Prettier, StyleLint) across the team, reducing style-related review
                friction and enforcing consistent code quality.
              </ExperienceSectionText>
            </ExperienceTextRow>
            <Image
              raised
              srcSet={[walmartProduct1]}
              placeholder={walmartProduct1}
              alt="A product page with review and messaging components."
              sizes={`(max-width: ${media.mobile}px) 300px, 400px`}
            />
          </ExperienceSectionContent>
        </ExperienceSection>
        <ExperienceSection>
          <ExperienceSectionColumns centered className={styles.columns}>
            <div className={styles.imagesText}>
              <ExperienceSectionHeading>
                Earlier: Wireless Verticals &amp; Baby Registry
              </ExperienceSectionHeading>
              <ExperienceSectionText>
                Before Marketplace, I launched Walmart Baby Registry, reaching 100K new
                registrants within 30 days. My team was the first at Walmart to adopt
                TypeScript, which earned us the internal Tech Evangelist Award.
              </ExperienceSectionText>
              <ExperienceSectionText>
                I also optimized the PDP buy-box to improve page speed by 15%, generating
                a 30bps conversion rate lift on one of Walmart.com&apos;s highest-traffic
                surfaces.
              </ExperienceSectionText>
            </div>
            <div className={styles.sidebarImages}>
              <Image
                className={styles.sidebarImage}
                srcSet={[walmartBabyRegistry1]}
                placeholder={walmartBabyRegistry1}
                alt="The Walmart Baby Registry landing page."
                sizes={`(max-width: ${media.mobile}px) 200px, 343px`}
              />
              <Image
                className={styles.sidebarImage}
                srcSet={[walmartBabyRegistry2]}
                placeholder={walmartBabyRegistry2}
                alt="Adding an item to a baby registry."
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
