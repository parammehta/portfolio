import { screen } from '@testing-library/react';
import { hashIds } from 'components/Navbar/navData';
import Home from 'pages/index.page';
import { renderPage } from './renderPage';

// jsdom has no WebGL context, so the Three.js hero canvas can't run here. It is
// decorative; stub it out so these tests cover the page's actual content.
jest.mock('pages/home/HeroSphere', () => ({
  HeroSphere: () => <canvas data-testid="hero-sphere" />,
}));

// The home page is two viewport panes: the hero and the profile. Experience and
// Skills are their own routes now, so the only thing left to keep in sync here
// is that every navbar hash link still has something to scroll to.
describe('home page', () => {
  it('renders the hero intro', async () => {
    renderPage(Home, { route: '/' });

    expect(await screen.findByText('Param Mehta')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent(/software engineer/i);
  });

  it('renders a section for every navbar hash link', async () => {
    renderPage(Home, { route: '/' });

    await screen.findByText('Param Mehta');

    // Derived from navData rather than hardcoded, so moving a section to its
    // own route can't leave this test asserting against a dead anchor.
    expect(hashIds.length).toBeGreaterThan(0);
    hashIds.forEach(id => {
      expect(document.getElementById(id)).toBeInTheDocument();
    });
  });

  it('offers resume and contact calls to action in the hero', async () => {
    renderPage(Home, { route: '/' });

    await screen.findByText('Param Mehta');

    expect(screen.getByRole('link', { name: /view resume/i })).toHaveAttribute(
      'href',
      '/resume'
    );
    expect(screen.getByRole('link', { name: /get in touch/i })).toHaveAttribute(
      'href',
      '/contact'
    );
  });

  it('scrolls the page itself rather than the document', async () => {
    const { container } = renderPage(Home, { route: '/' });

    await screen.findByText('Param Mehta');

    // ScrollRestore and useScrollToHash both look the container up by this
    // attribute; without it, hash navigation silently stops working.
    expect(container.querySelector('[data-scroll-container]')).toBeInTheDocument();
  });
});
