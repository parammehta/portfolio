import { screen } from '@testing-library/react';
import Home from 'pages/index.page';
import { renderPage } from './renderPage';

// jsdom has no WebGL context, so the Three.js hero canvas can't run here. It is
// decorative; stub it out so these tests cover the page's actual content.
jest.mock('pages/home/HeroSphere', () => ({
  HeroSphere: () => <canvas data-testid="hero-sphere" />,
}));

// The home page is the one route that stitches everything together: the hero,
// the scroll-spy sections the navbar hash links point at, and the experience
// entries that also exist as standalone routes.
describe('home page', () => {
  it('renders the hero intro', async () => {
    renderPage(Home, { route: '/' });

    expect(await screen.findByText('Param Mehta')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent(/software engineer/i);
  });

  it('renders a section for every navbar hash link', async () => {
    renderPage(Home, { route: '/' });

    await screen.findByText('Param Mehta');

    ['profile', 'experience', 'skills'].forEach(id => {
      expect(document.getElementById(id)).toBeInTheDocument();
    });
  });

  it('anchors the per-company experience sections the navbar submenu targets', async () => {
    renderPage(Home, { route: '/' });

    await screen.findByText('Param Mehta');

    ['experience-intuit', 'experience-rivian', 'experience-walmart'].forEach(id => {
      expect(document.getElementById(id)).toBeInTheDocument();
    });
  });
});
