import RouterLink from 'next/link';
import { forwardRef, type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { classes } from 'utils/style';
import styles from './Link.module.css';

const VALID_EXT = ['txt', 'png', 'jpg'];

function isAnchor(href?: string): boolean {
  const isValidExtension = VALID_EXT.includes(href?.split('.').pop() ?? '');
  return !!href?.includes('://') || href?.[0] === '#' || isValidExtension;
}

interface LinkProps extends ComponentPropsWithoutRef<'a'> {
  secondary?: boolean;
  children?: ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ rel, target, children, secondary, className, href, ...rest }, ref) => {
    const isExternal = href?.includes('://');
    const relValue = rel || (isExternal ? 'noreferrer noopener' : undefined);
    const targetValue = target || (isExternal ? '_blank' : undefined);
    const linkProps = {
      className: classes(styles.link, className),
      'data-secondary': secondary,
      rel: relValue,
      href,
      target: targetValue,
      ref,
      ...rest,
    };

    if (isAnchor(href)) {
      return <a {...linkProps}>{children}</a>;
    }

    return (
      <RouterLink scroll={false} {...linkProps} href={href ?? ''}>
        {children}
      </RouterLink>
    );
  }
);
