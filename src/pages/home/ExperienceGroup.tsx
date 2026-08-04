import { type ReactNode, type RefObject } from 'react';
import { Divider, Section, Transition } from 'components';
import styles from './ExperienceGroup.module.css';

interface ExperienceGroupProps {
  id: string;
  sectionRef: RefObject<HTMLElement | null>;
  visible: boolean;
  index: number;
  companyName: string;
  companyLogo?: string;
  invertOnDark?: boolean;
  children: ReactNode;
}

export const ExperienceGroup = ({
  id,
  sectionRef,
  visible,
  index,
  companyName,
  companyLogo,
  invertOnDark,
  children,
  ...rest
}: ExperienceGroupProps) => (
  <Section
    className={styles.group}
    as="section"
    id={id}
    ref={sectionRef}
    aria-label={companyName}
    data-first={index === 1}
    {...rest}
  >
    <Transition in={visible}>
      {(visible: boolean) => (
        <>
          {companyLogo && (
            <div className={styles.header}>
              <img
                src={companyLogo}
                alt=""
                aria-hidden
                className={styles.companyLogo}
                data-visible={visible}
                data-invert-dark={invertOnDark || undefined}
              />
            </div>
          )}

          {children}

          <div className={styles.dividerWrap}>
            <Divider
              className={styles.sectionDivider}
              notch={false}
              light
              collapsed={!visible}
              collapseDelay={1200}
            />
          </div>
        </>
      )}
    </Transition>
  </Section>
);
