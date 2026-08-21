import Head from 'next/head';
import { Meta } from 'components';
import { Link } from 'refract-ui';

// The contact form moved from its own route to a section on the home page
// (`/#contact`), but `/contact/` was a live, indexed URL — external links and
// old search results still point at it. This keeps it resolvable instead of
// 404ing. The meta-refresh alone covers every client — JS or not, crawler or
// browser — so there's no separate client-side redirect: a router.replace
// alongside it just raced the same navigation twice.
export default function ContactRedirect() {
  return (
    <>
      <Meta title="Contact" description="This page has moved to the home page." />
      <Head>
        <meta httpEquiv="refresh" content="0;url=/#contact" />
        {/* No canonical override here: Meta already emits one for this page's
            own URL (via _app's per-route logic), and pairing a
            canonical-elsewhere with noindex is a conflicting signal Google
            explicitly documents as unreliable — noindex alone is enough to
            keep this redirect stub out of the index. */}
        <meta name="robots" content="noindex" />
      </Head>
      <p>
        This page has moved. Redirecting to{' '}
        <Link href="/#contact">the contact section</Link>.
      </p>
    </>
  );
}
