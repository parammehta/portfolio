import { screen, within } from '@testing-library/react';
import Page404 from 'pages/404/index.page';
import Articles from 'pages/articles/index.page';
import Resume from 'pages/resume/index.page';
import { renderPage } from './renderPage';

describe('articles index', () => {
  const posts = [
    { slug: 'second-post', title: 'Second post', abstract: 'Second abstract', date: '2024-02-01', timecode: '2 min read' },
    { slug: 'third-post', title: 'Third post', abstract: 'Third abstract', date: '2024-01-01', timecode: '3 min read' },
  ];
  const featured = {
    slug: 'featured-post',
    title: 'Featured post',
    abstract: 'Featured abstract',
    date: '2024-03-01',
    timecode: '4 min read',
    featured: true,
  };

  it('lists every post and links each one to its article route', () => {
    renderPage(Articles, { route: '/articles', pageProps: { posts, featured } });

    [featured, ...posts].forEach(post => {
      const link = screen.getByRole('link', { name: new RegExp(post.title) });
      expect(link).toHaveAttribute('href', `/articles/${post.slug}`);
    });
  });

  it('shows each post’s reading time', () => {
    renderPage(Articles, { route: '/articles', pageProps: { posts, featured } });

    expect(screen.getByText('4 min read')).toBeInTheDocument();
    expect(screen.getByText('2 min read')).toBeInTheDocument();
  });
});

describe('resume page', () => {
  it('offers the PDF actions inside the shell', () => {
    renderPage(Resume, { route: '/resume' });

    expect(screen.getByText('Download PDF')).toBeInTheDocument();
    expect(screen.getByText('Open in new tab')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});

describe('404 page', () => {
  it('renders the not-found copy and a way back home', () => {
    renderPage(Page404, { route: '/does-not-exist' });

    const main = screen.getByRole('main');
    expect(within(main).getByText(/404/)).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '/'
    );
  });
});
