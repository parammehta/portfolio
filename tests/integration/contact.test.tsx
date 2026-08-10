import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Contact from 'pages/contact/index.page';
import { renderPage } from './renderPage';

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

describe('contact page', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the form inside the app shell', () => {
    renderPage(Contact, { route: '/contact' });

    expect(screen.getByLabelText('Your Email')).toBeRequired();
    expect(screen.getByLabelText('Message')).toBeRequired();
    // The shell's navbar plus the page's own breadcrumb trail.
    expect(screen.getAllByRole('navigation').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  it('posts the message to the API and shows the success state', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => ({}),
    });

    renderPage(Contact, { route: '/contact' });
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

    renderPage(Contact, { route: '/contact' });
    await fillAndSubmit(user);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });

  it('silently completes without calling the API when the honeypot is filled', async () => {
    const user = userEvent.setup();

    renderPage(Contact, { route: '/contact' });
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
      renderPage(Contact, { route: '/contact' });
      await fillAndSubmit(user);

      expect(await screen.findByText(/security check not complete/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      delete process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
    }
  });
});
