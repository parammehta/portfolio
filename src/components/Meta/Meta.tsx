import Head from 'next/head';
import { useRouter } from 'next/router';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;
const name = 'Param Mehta';
const twitterHandle = '@abovepar_am';
const defaultOgImage = `${siteUrl}/social-image.jpg`;
const defaultOgImageSize = { width: 1280, height: 679 };
// Per-article cards come from puppeteer's viewport in articles/og-image.ts.
const articleOgImageSize = { width: 1200, height: 630 };

interface MetaProps {
  title?: string;
  description?: string;
  prefix?: string;
  ogImage?: string;
  /** Describes the share image for link previews. Defaults to the page title. */
  ogImageAlt?: string;
  ogType?: 'website' | 'article';
  /** ISO date string; only rendered when `ogType` is `'article'`. */
  publishedTime?: string;
}

export const Meta = ({
  title,
  description,
  prefix = name,
  ogImage = defaultOgImage,
  ogImageAlt,
  ogType = 'website',
  publishedTime,
}: MetaProps) => {
  const titleText = [prefix, title].filter(Boolean).join(' | ');
  // Mirrors the canonical-link logic in _app.page.tsx, so og:url always
  // matches the page's own canonical rather than the site root.
  const { route, asPath } = useRouter();
  const canonicalRoute = route === '/' ? '' : asPath;
  const pageUrl = `${siteUrl}${canonicalRoute}`;
  const ogImageSize = ogImage === defaultOgImage ? defaultOgImageSize : articleOgImageSize;
  const imageAlt =
    ogImageAlt ?? (title ? `${title} – ${name}` : `${name} – portfolio site banner`);

  return (
    <Head>
      <title key="title">{titleText}</title>
      <meta key="description" name="description" content={description} />
      <meta name="author" content={name} />

      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content={String(ogImageSize.width)} />
      <meta property="og:image:height" content={String(ogImageSize.height)} />

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
