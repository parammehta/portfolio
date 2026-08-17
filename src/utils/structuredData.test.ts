import { blogPostingSchema, breadcrumbListSchema, personSchema } from 'utils/structuredData';

describe('personSchema', () => {
  it('returns a schema.org Person with sameAs links, excluding Storybook', () => {
    const schema = personSchema();

    expect(schema['@type']).toBe('Person');
    expect(schema.name).toBe('Param Mehta');
    expect(schema.sameAs).toEqual(
      expect.arrayContaining([
        'https://twitter.com/abovepar_am',
        'https://www.linkedin.com/in/parammehta/',
        'https://github.com/parammehta',
      ])
    );
    expect(schema.sameAs).not.toEqual(
      expect.arrayContaining(['https://storybook.parammehta.com'])
    );
  });
});

describe('blogPostingSchema', () => {
  it('returns a schema.org BlogPosting with the given fields', () => {
    const schema = blogPostingSchema({
      title: 'My Post',
      description: 'A post about things.',
      datePublished: '2024-01-01',
      image: 'https://example.com/image.png',
      url: 'https://example.com/articles/my-post/',
    });

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'My Post',
      description: 'A post about things.',
      datePublished: '2024-01-01',
      image: 'https://example.com/image.png',
      url: 'https://example.com/articles/my-post/',
      author: { '@type': 'Person', name: 'Param Mehta' },
    });
  });

  it('omits image when not provided', () => {
    const schema = blogPostingSchema({
      title: 'My Post',
      description: 'A post about things.',
      datePublished: '2024-01-01',
      url: 'https://example.com/articles/my-post/',
    });

    expect(schema).not.toHaveProperty('image');
  });
});

describe('breadcrumbListSchema', () => {
  it('maps breadcrumb items to positioned ListItem entries with absolute URLs', () => {
    const schema = breadcrumbListSchema([
      { label: 'Home', href: '/' },
      { label: 'Articles', href: '/articles' },
    ]);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toEqual([
      expect.objectContaining({ '@type': 'ListItem', position: 1, name: 'Home' }),
      expect.objectContaining({ '@type': 'ListItem', position: 2, name: 'Articles' }),
    ]);
  });
});
