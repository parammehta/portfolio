import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { companies } from 'data/experience';
import Experience from 'pages/experience/index.page';
import Skills from 'pages/skills/index.page';
import { renderPage } from './renderPage';

// /experience replaced the stacked company sections that used to live on the
// home page, so the coverage those sections had moves here.
describe('experience index', () => {
  it('renders a tab for every company', () => {
    renderPage(Experience, { route: '/experience' });

    companies.forEach(company => {
      expect(screen.getByRole('tab', { name: company.shortName })).toBeInTheDocument();
    });
  });

  it('shows the first company by default and links to its detail page', () => {
    renderPage(Experience, { route: '/experience' });

    const [first] = companies;
    expect(screen.getByRole('tab', { name: first.shortName })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByRole('heading', { name: first.roles[0].title })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: /see details/i })).toHaveAttribute(
      'href',
      `/experience/${first.slug}`
    );
  });

  it('switches companies and shows every role for the selected one', async () => {
    const user = userEvent.setup();
    renderPage(Experience, { route: '/experience' });

    // Walmart is the multi-role case: all three roles have to be reachable,
    // since the tab pane is the only place they appear outside the detail page.
    const walmart = companies.find(company => company.slug === 'walmart')!;
    await user.click(screen.getByRole('tab', { name: walmart.shortName }));

    const panel = screen.getByRole('tabpanel');
    walmart.roles.forEach(role => {
      expect(within(panel).getByRole('heading', { name: role.title })).toBeInTheDocument();
    });
    expect(within(panel).getByRole('link', { name: /see details/i })).toHaveAttribute(
      'href',
      '/experience/walmart'
    );
  });
});

describe('skills page', () => {
  it('renders the tech and development blocks inside the shell', () => {
    renderPage(Skills, { route: '/skills' });

    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: 'Tech' })).toBeInTheDocument();
    expect(within(main).getByRole('heading', { name: 'Development' })).toBeInTheDocument();
    expect(within(main).getByText(/TypeScript/)).toBeInTheDocument();
  });
});
