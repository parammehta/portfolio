import type { BreadcrumbItem } from 'refract-ui';
import { socialLinks } from 'components/Navbar/navData';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;
const name = 'Param Mehta';

export const personSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name,
  url: siteUrl,
  jobTitle: 'Software Engineer',
  sameAs: socialLinks.filter(link => link.label !== 'Storybook').map(link => link.url),
});

interface BlogPostingSchemaProps {
  title: string;
  description: string;
  datePublished: string;
  image?: string;
  url: string;
}

export const blogPostingSchema = ({
  title,
  description,
  datePublished,
  image,
  url,
}: BlogPostingSchemaProps) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description,
  datePublished,
  ...(image && { image }),
  url,
  author: {
    '@type': 'Person',
    name,
    url: siteUrl,
  },
});

export const breadcrumbListSchema = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: `${siteUrl}${item.href}`,
  })),
});
