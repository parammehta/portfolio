import { screen, within } from '@testing-library/react';
import { hashIds } from 'components/Navbar/navData';
import { companies } from 'data/experience';
import Home from 'pages/index.page';
import { renderPage } from './renderPage';

// jsdom has no WebGL context, so the Three.js hero canvas can't run here. It is
// decorative; stub it out so these tests cover the page's actual content.
jest.mock('pages/home/HeroSphere', () => ({
  HeroSphere: () => <canvas data-testid="hero-sphere" />,
}));

// The home page is a deck of viewport-tall panes, plus the experience timeline,
// which takes a multi-viewport runway so its track has something to travel over.
// Skills is its own route now, so the rest of what's kept in sync here is that
// every navbar hash link still has something to scroll to.
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

    const resumeLinks = screen.getAllByRole('link', { name: /view resume/i });
    expect(resumeLinks.length).toBeGreaterThanOrEqual(1);
    expect(resumeLinks[0]).toHaveAttribute('href', '/resume');

    const contactLinks = screen.getAllByRole('link', { name: /get in touch/i });
    expect(contactLinks.length).toBeGreaterThanOrEqual(1);
    expect(contactLinks[0]).toHaveAttribute('href', '/#contact');
  });

  it('puts every role on the experience timeline, newest first', async () => {
    renderPage(Home, { route: '/' });

    await screen.findByText('Param Mehta');

    // Derived from the data, not hardcoded: the timeline flattens companies to
    // one node per role, and the left-to-right order is `data/experience`'s own
    // order. A role added there has to appear here without touching this test.
    const expected = companies.flatMap(company =>
      company.roles.map(role => `${role.title} at ${company.name}, ${role.dateRange}`)
    );

    const timeline = screen.getByRole('region', { name: 'Work history' });
    const labels = within(timeline)
      .getAllByRole('button')
      .map(node => node.getAttribute('aria-label'));

    expect(labels).toEqual(expected);
  });

  it('points the timeline call to action at the active role\'s company', async () => {
    renderPage(Home, { route: '/' });

    await screen.findByText('Param Mehta');

    // The first node is active on mount, so the CTA belongs to its company.
    const first = companies[0];
    const cta = screen.getByRole('link', { name: `Read about ${first.name}` });
    expect(cta).toHaveAttribute('href', `/experience/${first.slug}`);
  });

  it('gives the experience section its own scroll runway', async () => {
    renderPage(Home, { route: '/' });

    await screen.findByText('Param Mehta');

    // Every other pane is exactly one snapport tall. Home.module.css keys the
    // runway override off this attribute; without it the section collapses back
    // to a single viewport and the timeline has nothing to travel over.
    expect(document.getElementById('experience')).toHaveAttribute('data-runway');
  });

  it('scrolls the page itself rather than the document', async () => {
    const { container } = renderPage(Home, { route: '/' });

    await screen.findByText('Param Mehta');

    // ScrollRestore and useScrollToHash both look the container up by this
    // attribute; without it, hash navigation silently stops working.
    expect(container.querySelector('[data-scroll-container]')).toBeInTheDocument();
  });
});
