import { forwardRef } from 'react';
import NextLink from 'next/link';
import type { LinkComponentProps } from 'refract-ui';

// Adapts next/link to the LinkComponent shape refract-ui's LinkProvider expects,
// so Button and Link get client-side routing without depending on Next directly.
export const NextLinkAdapter = forwardRef<HTMLAnchorElement, LinkComponentProps>(
  (props, ref) => <NextLink scroll={false} {...props} ref={ref} />
);

NextLinkAdapter.displayName = 'NextLinkAdapter';
