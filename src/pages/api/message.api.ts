/**
 * Contact form endpoint.
 *
 * This is a port of the Express handler that used to run as an AWS Lambda
 * behind API Gateway (`functions/index.js`, deployed with the Serverless
 * Framework). It moved in-repo when the site left S3 for Vercel: the site is no
 * longer a static export, so it can carry its own server code and the form no
 * longer has to make a cross-origin call to a separately deployed service.
 *
 * Two things changed in the port, both deliberate:
 *
 *   1. Credentials. The Lambda got SES access from an IAM role attached to the
 *      function. There is no such role here, so the keys arrive as env vars and
 *      are passed to the SES client explicitly.
 *
 *   2. Sanitising. The old handler ran the fields through DOMPurify, which
 *      needs a DOM, which meant jsdom — a heavy dependency to pull into the
 *      site's own runtime for this. Every field ends up in a plaintext email
 *      body and nothing here is ever rendered as HTML, so the equivalent
 *      protection is stripping markup and control characters, which `clean`
 *      below does without a DOM. CR/LF are stripped too: the address is
 *      interpolated into the subject line, and that is where header injection
 *      would go if the SDK were not already encoding it.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const TO_EMAIL = 'param.mehta95@gmail.com';
const FROM_EMAIL = 'param.mehta95@gmail.com';
const MAX_EMAIL_LENGTH = 512;
const MAX_MESSAGE_LENGTH = 4096;

/**
 * Carried over from the Lambda verbatim. Deliberately simple: it does not try
 * to fully validate email syntax, it just rejects obvious non-emails. (The
 * pattern it replaced, /(.+)@(.+){2,}\.(.+){2,}/, nested unbounded quantifiers
 * and backtracked catastrophically on crafted input.)
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The browser's own CORS rules no longer protect this endpoint the way they did
 * when it lived on another origin: a cross-site POST still *reaches* the
 * handler, the attacker just cannot read the reply — which is no comfort when
 * the side effect is the email itself. So the origin is checked here instead.
 *
 * Requests with no Origin header are allowed through: curl and server-side
 * callers send none, and rejecting them would buy nothing (anyone can omit a
 * header) while breaking the integration tests.
 */
const ALLOWED_ORIGINS = ['https://parammehta.com', 'https://www.parammehta.com'];

function originAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Preview deployments get a generated *.vercel.app origin, so the form is
  // testable on a preview URL before it is testable in production.
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
}

/**
 * Strip markup and anything that is not printable text. See the note at the top
 * of the file for why this replaced DOMPurify.
 *
 * `allowNewlines` exists because the two fields are not alike. The address is
 * interpolated into the subject line, where a newline is header injection, so
 * it gets none. The message becomes the body, where flattening every newline
 * would turn a paragraphed message into one run-on blob — a regression in the
 * email itself, for no security gain.
 */
function clean(value: unknown, { allowNewlines = false } = {}): string {
  if (typeof value !== 'string') return '';
  const control = allowNewlines
    ? // eslint-disable-next-line no-control-regex
      /[\x00-\x09\x0b\x0c\x0e-\x1f\x7f]/g
    : // eslint-disable-next-line no-control-regex
      /[\x00-\x1f\x7f]/g;

  return value.replace(/<[^>]*>/g, '').replace(control, ' ').trim();
}

/**
 * Built per request, with credentials passed in explicitly and required.
 *
 * Leaving `credentials` unset would hand the job to the SDK's default provider
 * chain, and the chain does not stop at "nothing configured" — it reads
 * ~/.aws/credentials. A developer running the site locally would then send real
 * mail through their own AWS account from a form they thought was inert, which
 * is exactly what happened while this port was being tested. Missing
 * configuration should fail loudly instead.
 */
function sesClient(): SESClient {
  const accessKeyId = process.env.PORTFOLIO_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.PORTFOLIO_AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'Contact form is not configured: PORTFOLIO_AWS_ACCESS_KEY_ID and ' +
        'PORTFOLIO_AWS_SECRET_ACCESS_KEY must both be set.'
    );
  }

  return new SESClient({
    region: process.env.PORTFOLIO_AWS_REGION ?? 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function passesTurnstile(token: unknown, ip: string | undefined): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET;
  if (!secret) return true; // Unconfigured means unenforced, as before.

  const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  const { success } = (await verification.json()) as { success?: boolean };
  return Boolean(success);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!originAllowed(req.headers.origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const isBot = clean(req.body?.name);
    const email = clean(req.body?.email);
    const message = clean(req.body?.message, { allowNewlines: true });

    // The honeypot field is invisible to humans, so anything in it came from a
    // bot. Succeed without sending, so the bot has nothing to learn from.
    if (isBot) {
      return res.status(200).json({});
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim();

    if (!(await passesTurnstile(req.body?.turnstileToken, ip))) {
      return res.status(400).json({ error: 'Security check failed. Please refresh and try again.' });
    }

    if (!email || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Please enter a message' });
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return res
        .status(400)
        .json({ error: `Please enter an email fewer than ${MAX_EMAIL_LENGTH} characters` });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res
        .status(400)
        .json({ error: `Please enter a message fewer than ${MAX_MESSAGE_LENGTH} characters` });
    }

    await sesClient().send(
      new SendEmailCommand({
        Source: `Portfolio <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: {
          Subject: { Data: `New message from ${email}` },
          Body: { Text: { Data: `From: ${email}\n\n${message}` } },
        },
      })
    );

    return res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Rejected', error);
    return res.status(500).json({ error: 'Message rejected' });
  }
}
