import Head from 'next/head';
import { useRouter } from 'next/router';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;
const name = 'Param Mehta';
const twitterHandle = '@abovepar_am';
const defaultOgImage = `${siteUrl}/social-image.png`;

interface MetaProps {
  title?: string;
  description?: string;
  prefix?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  /** ISO date string; only rendered when `ogType` is `'article'`. */
  publishedTime?: string;
}

export const Meta = ({
  title,
  description,
  prefix = name,
  ogImage = defaultOgImage,
  ogType = 'website',
  publishedTime,
}: MetaProps) => {
  const titleText = [prefix, title].filter(Boolean).join(' | ');
  // Mirrors the canonical-link logic in _app.page.tsx, so og:url always
  // matches the page's own canonical rather than the site root.
  const { route, asPath } = useRouter();
  const canonicalRoute = route === '/' ? '' : asPath;
  const pageUrl = `${siteUrl}${canonicalRoute}`;

  return (
    <Head>
      <title key="title">{titleText}</title>
      <meta key="description" name="description" content={description} />
      <meta name="author" content={name} />

      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content="Banner for the site" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1280" />
      <meta property="og:image:height" content="675" />

      <meta property="og:title" content={titleText} />
      <meta property="og:site_name" content={name} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:description" content={description} />
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:title" content={titleText} />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
};
