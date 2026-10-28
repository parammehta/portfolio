declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_WEBSITE_URL: string;
    NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?: string;
    NEXT_PUBLIC_ANALYTICS_EVENTS_URL?: string;
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?: string;

    // Server-only, read by src/pages/api/message.api.ts. The contact form's
    // SES access came from the Lambda's IAM role before the endpoint moved
    // into this repo; on Vercel it needs credentials of its own.
    PORTFOLIO_AWS_ACCESS_KEY_ID?: string;
    PORTFOLIO_AWS_SECRET_ACCESS_KEY?: string;
    PORTFOLIO_AWS_REGION?: string;
    CLOUDFLARE_TURNSTILE_SECRET?: string;
  }
}
