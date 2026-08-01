import { forwardRef, type ElementType, type ReactNode, type Ref } from 'react';
import { classes } from 'utils/style';
import styles from './Section.module.css';

type SectionProps = {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
} & Record<string, unknown>;

export const Section = forwardRef<HTMLElement | null, SectionProps>(
  ({ as: Component = 'div', children, className, ...rest }, ref) => {
    const Element = Component as ElementType;
    return (
      <Element
        className={classes(styles.section, className as string)}
        ref={ref as Ref<HTMLElement>}
        {...rest}
      >
        {children}
      </Element>
    );
  }
);
