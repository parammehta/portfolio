import { Fragment, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { classes } from 'utils/style';
import styles from './Heading.module.css';

export interface HeadingProps extends ComponentPropsWithoutRef<'h1'> {
  children?: ReactNode;
  level?: number;
  as?: ElementType;
  align?: string;
  weight?: string;
}

export const Heading = ({
  children,
  level = 1,
  as,
  align = 'auto',
  weight = 'medium',
  className,
  ...rest
}: HeadingProps) => {
  const clampedLevel = Math.min(Math.max(level, 0), 5);
  const Component = as || (`h${Math.max(clampedLevel, 1)}` as ElementType);

  return (
    <Fragment>
      <Component
        className={classes(styles.heading, className)}
        data-align={align}
        data-weight={weight}
        data-level={clampedLevel}
        {...rest}
      >
        {children}
      </Component>
    </Fragment>
  );
};
