declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_WEBSITE_URL: string;
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_FATHOM_ID: string;
    NEXT_PUBLIC_FATHOM_URL: string;
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?: string;
  }
}
