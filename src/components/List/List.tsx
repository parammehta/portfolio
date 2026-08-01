import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { classes } from 'utils/style';
import styles from './List.module.css';

interface ListProps extends ComponentPropsWithoutRef<'ul'> {
  ordered?: boolean;
  children?: ReactNode;
}

export const List = ({ ordered, children, className, ...rest }: ListProps) => {
  const Element = ordered ? 'ol' : 'ul';

  return (
    <Element className={classes(styles.list, className)} {...rest}>
      {children}
    </Element>
  );
};

interface ListItemProps extends ComponentPropsWithoutRef<'li'> {
  children?: ReactNode;
}

export const ListItem = ({ children, ...rest }: ListItemProps) => {
  return (
    <li className={styles.item} {...rest}>
      {children}
    </li>
  );
};
