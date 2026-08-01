import { type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { classes } from 'utils/style';
import styles from './Text.module.css';

export interface TextProps extends ComponentPropsWithoutRef<'span'> {
  children?: ReactNode;
  size?: 's' | 'm' | 'l' | 'xl';
  as?: ElementType;
  align?: string;
  weight?: string;
  secondary?: boolean;
}

export const Text = ({
  children,
  size = 'm',
  as: Component = 'span',
  align = 'auto',
  weight = 'auto',
  secondary,
  className,
  ...rest
}: TextProps) => {
  return (
    <Component
      className={classes(styles.text, className)}
      data-align={align}
      data-size={size}
      data-weight={weight}
      data-secondary={secondary}
      {...rest}
    >
      {children}
    </Component>
  );
};
