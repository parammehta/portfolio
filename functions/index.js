const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const aws = require('@aws-sdk/client-ses');

const app = express();
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const ses = new aws.SES({
  region: 'us-east-1',
});

const ORIGINS = ['https://parammehta.com', 'https://www.parammehta.com'];
const MAX_EMAIL_LENGTH = 512;
const MAX_MESSAGE_LENGTH = 4096;
const EMAIL = 'param.mehta95@gmail.com';
const FROM_EMAIL = 'param.mehta95@gmail.com';
const EMAIL_PATTERN = /(.+)@(.+){2,}\.(.+){2,}/;

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!ORIGINS.includes(origin)) {
        return callback(
          new Error(`Not allowed by CORS. Origin must be: ${ORIGINS.join(' or ')}`)
        );
      }

      return callback(null, true);
    },
  })
);
app.options('*', cors());

app.post('/message', async (req, res) => {
  try {
    const isBot = DOMPurify.sanitize(req.body.name);
    const email = DOMPurify.sanitize(req.body.email);
    const message = DOMPurify.sanitize(req.body.message);
    const turnstileToken = req.body.turnstileToken;

    // Silently succeed without sending if the honeypot field was filled in by a bot
    if (isBot) {
      return res.status(200).json({});
    }

    // Verify Turnstile token if configured
    if (process.env.CLOUDFLARE_TURNSTILE_SECRET) {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.CLOUDFLARE_TURNSTILE_SECRET,
          response: turnstileToken,
          remoteip: req.headers['x-forwarded-for'] || req.ip,
        }),
      });
      const { success } = await verifyRes.json();
      if (!success) {
        return res.status(400).json({ error: 'Security check failed. Please refresh and try again.' });
      }
    }

    // Validate email request
    if (!email || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Please enter a message' });
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return res.status(400).json({
        error: `Please enter an email fewer than ${MAX_EMAIL_LENGTH} characters`,
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Please enter a message fewer than ${MAX_MESSAGE_LENGTH} characters`,
      });
    }

    // Send email using AWS SES
    await ses.sendEmail({
      Source: `Portfolio <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [EMAIL],
      },
      Message: {
        Subject: { Data: `New message from ${email}` },
        Body: {
          Text: { Data: `From: ${email}\n\n${message}` },
        },
      },
    });

    return res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Rejected', error);
    return res.status(500).json({ error: 'Message rejected' });
  }
});

module.exports.handler = serverless(app);
