/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';

const send = jest.fn();

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({ send })),
  SendEmailCommand: jest.fn().mockImplementation(input => ({ input })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const handler = require('./message.api').default as (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void>;

type Body = Record<string, unknown>;

function call(body: Body, { method = 'POST', origin }: { method?: string; origin?: string } = {}) {
  const req = {
    method,
    headers: origin ? { origin } : {},
    body,
  } as unknown as NextApiRequest;

  const res = {
    statusCode: 0,
    payload: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };

  return handler(req, res as unknown as NextApiResponse).then(() => res);
}

const VALID = { email: 'someone@example.com', message: 'hello there' };

beforeEach(() => {
  // The failure paths below log deliberately; without this the suite's output
  // is mostly stack traces from tests that passed.
  jest.spyOn(console, 'error').mockImplementation(() => {});
  send.mockReset();
  send.mockResolvedValue({});
  process.env.PORTFOLIO_AWS_ACCESS_KEY_ID = 'test-key';
  process.env.PORTFOLIO_AWS_SECRET_ACCESS_KEY = 'test-secret';
  delete process.env.CLOUDFLARE_TURNSTILE_SECRET;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('POST /api/message', () => {
  it('sends the message and reports success', async () => {
    const res = await call(VALID, { origin: 'https://parammehta.com' });

    expect(res.statusCode).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);

    const { input } = send.mock.calls[0][0];
    expect(input.Destination.ToAddresses).toEqual(['param.mehta95@gmail.com']);
    expect(input.Message.Body.Text.Data).toContain('hello there');
    expect(input.Message.Subject.Data).toContain('someone@example.com');
  });

  it('rejects anything but POST', async () => {
    const res = await call(VALID, { method: 'GET' });

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
    expect(send).not.toHaveBeenCalled();
  });

  // The endpoint is same-origin now, so a cross-site POST still reaches it —
  // the browser only withholds the response, which does not un-send an email.
  it('refuses a cross-site origin', async () => {
    const res = await call(VALID, { origin: 'https://evil.example' });

    expect(res.statusCode).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it('allows preview deployments and origin-less callers', async () => {
    expect((await call(VALID, { origin: 'https://portfolio-abc123.vercel.app' })).statusCode).toBe(
      200
    );
    expect((await call(VALID)).statusCode).toBe(200);
  });

  // The honeypot is invisible to humans, so a filled one means a bot. It gets a
  // success it can learn nothing from.
  it('silently drops a submission that filled the honeypot', async () => {
    const res = await call({ ...VALID, name: 'a bot' });

    expect(res.statusCode).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    ['an invalid address', { ...VALID, email: 'not-an-email' }, 'valid email'],
    ['a missing address', { ...VALID, email: '' }, 'valid email'],
    ['an empty message', { ...VALID, message: '' }, 'enter a message'],
    ['an over-long message', { ...VALID, message: 'x'.repeat(4097) }, 'fewer than 4096'],
    ['an over-long address', { ...VALID, email: `${'x'.repeat(512)}@example.com` }, 'fewer than 512'],
  ])('rejects %s', async (_label, body, expected) => {
    const res = await call(body);

    expect(res.statusCode).toBe(400);
    expect((res.payload as { error: string }).error).toContain(expected);
    expect(send).not.toHaveBeenCalled();
  });

  it('strips markup from the message but keeps its line breaks', async () => {
    await call({
      email: 'someone@example.com',
      message: '<script>alert(1)</script>first para\n\nsecond para',
    });

    const { input } = send.mock.calls[0][0];
    expect(input.Message.Body.Text.Data).not.toContain('<script>');
    expect(input.Message.Body.Text.Data).toContain('alert(1)first para\n\nsecond para');
  });

  // The address lands in the subject line, so a newline there is header
  // injection — unlike in the body, it does not survive.
  it('flattens newlines in the address', async () => {
    await call({
      email: 'someone@example.com\r\nBcc: elsewhere@example.com',
      message: 'hello',
    });

    // The flattened address no longer matches the email pattern, so it is
    // rejected outright rather than reaching SES with a smuggled header.
    expect(send).not.toHaveBeenCalled();
  });

  // Falling back to the SDK's default credential chain would read
  // ~/.aws/credentials and send real mail from a developer's own account.
  it('fails without explicit credentials rather than finding ambient ones', async () => {
    delete process.env.PORTFOLIO_AWS_ACCESS_KEY_ID;
    delete process.env.PORTFOLIO_AWS_SECRET_ACCESS_KEY;

    const res = await call(VALID);

    expect(res.statusCode).toBe(500);
    expect(send).not.toHaveBeenCalled();
  });

  it('reports a rejection rather than leaking the SES error', async () => {
    send.mockRejectedValue(new Error('SES exploded with account details in it'));

    const res = await call(VALID);

    expect(res.statusCode).toBe(500);
    expect(res.payload).toEqual({ error: 'Message rejected' });
  });
});

describe('Turnstile', () => {
  it('rejects a submission whose token does not verify', async () => {
    process.env.CLOUDFLARE_TURNSTILE_SECRET = 'secret';
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: false }) });

    const res = await call({ ...VALID, turnstileToken: 'bad' });

    expect(res.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends when the token verifies', async () => {
    process.env.CLOUDFLARE_TURNSTILE_SECRET = 'secret';
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: true }) });

    const res = await call({ ...VALID, turnstileToken: 'good' });

    expect(res.statusCode).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
