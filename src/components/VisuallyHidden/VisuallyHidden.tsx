import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { classes } from 'utils/style';
import styles from './VisuallyHidden.module.css';

export interface VisuallyHiddenProps extends ComponentPropsWithoutRef<'span'> {
  showOnFocus?: boolean;
  as?: ElementType;
  children?: ReactNode;
  visible?: boolean;
  href?: string;
  [key: string]: unknown;
}

export const VisuallyHidden = forwardRef<HTMLElement, VisuallyHiddenProps>(
  ({ className, showOnFocus, as: Component = 'span', children, visible, ...rest }, ref) => {
    const Element = Component as ElementType;
    return (
      <Element
        className={classes(styles.hidden, className as string)}
        data-hidden={!visible && !showOnFocus}
        data-show-on-focus={showOnFocus}
        ref={ref}
        {...rest}
      >
        {children}
      </Element>
    );
  }
);
