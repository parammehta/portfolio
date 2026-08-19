import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from 'pages/index.page';
import { renderPage } from './renderPage';

// The contact form now lives as the third pane of the home page rather than on
// its own route, so it's exercised through the whole home page here.
jest.mock('pages/home/HeroSphere', () => ({
  HeroSphere: () => <canvas data-testid="hero-sphere" />,
}));

// Turnstile is skipped when NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is unset,
// which is the case in tests — same code path as a local dev run without it.

const fillAndSubmit = async (
  user: ReturnType<typeof userEvent.setup>,
  { email = 'someone@example.com', message = 'Hello there' } = {}
) => {
  await user.type(screen.getByLabelText('Your Email'), email);
  await user.type(screen.getByLabelText('Message'), message);
  await user.click(screen.getByRole('button', { name: /send message/i }));
};

describe('contact form on the home page', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the form as a section of the home page', () => {
    renderPage(Home, { route: '/' });

    expect(screen.getByLabelText('Your Email')).toBeRequired();
    expect(screen.getByLabelText('Message')).toBeRequired();
    // The pane the navbar's /#contact link scrolls to.
    expect(document.getElementById('contact')).toBeInTheDocument();
  });

  it('posts the message to the API and shows the success state', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => ({}),
    });

    renderPage(Home, { route: '/' });
    await fillAndSubmit(user);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toMatch(/\/message$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      email: 'someone@example.com',
      message: 'Hello there',
    });

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
  });

  it('surfaces the API error message when the send fails', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 500,
      json: async () => ({ error: 'Something went wrong' }),
    });

    renderPage(Home, { route: '/' });
    await fillAndSubmit(user);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });

  it('silently completes without calling the API when the honeypot is filled', async () => {
    const user = userEvent.setup();

    renderPage(Home, { route: '/' });
    await user.type(screen.getByLabelText('Name'), 'spam bot');
    await fillAndSubmit(user);

    await waitFor(() => expect(screen.getByText(/message sent/i)).toBeInTheDocument());
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses to send until Turnstile has issued a token', async () => {
    const user = userEvent.setup();
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY = 'test-site-key';
    // The real widget never loads in jsdom, so no token is ever produced.
    window.turnstile = { render: () => 'id', remove: () => {}, reset: () => {} };

    try {
      renderPage(Home, { route: '/' });
      await fillAndSubmit(user);

      expect(await screen.findByText(/security check not complete/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      delete process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
    }
  });
});
