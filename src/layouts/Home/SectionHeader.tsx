import { type RefObject } from 'react';
import { DecoderText, Divider, Heading, Section, Transition } from 'components';
import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
  id: string;
  visible: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  eyebrow?: string;
  title: string;
}

export const SectionHeader = ({ id, visible, sectionRef, eyebrow, title }: SectionHeaderProps) => (
  <Section className={styles.sectionHeader} id={id} ref={sectionRef} as="section">
    <Transition in={visible} timeout={0}>
      {(transVisible: boolean) => (
        <div className={styles.inner}>
          {eyebrow && (
            <div className={styles.tag} aria-hidden>
              <Divider
                notchWidth="64px"
                notchHeight="8px"
                collapsed={!transVisible}
                collapseDelay={1000}
              />
              <div className={styles.tagText} data-visible={transVisible}>
                {eyebrow}
              </div>
            </div>
          )}
          <Heading
            level={2}
            as="h2"
            className={styles.title}
            data-visible={transVisible}
          >
            <DecoderText text={title} start={transVisible} delay={300} />
          </Heading>
        </div>
      )}
    </Transition>
  </Section>
);
