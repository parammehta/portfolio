/**
 * Analytics for the static export.
 *
 * Pageviews are handled entirely by the Cloudflare Web Analytics beacon, which
 * `_app.page.tsx` injects when `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` is set.
 * The beacon runs in SPA mode, so it hooks `history` itself and reports each
 * client-side route change without us calling anything.
 *
 * Custom events are a different story: Cloudflare Web Analytics has no
 * event API at all — it collects pageviews and Core Web Vitals, full stop.
 * So `trackEvent` deliberately has no built-in destination. It exists to keep
 * the instrumentation at the call sites (which is the part that is tedious to
 * add later and easy to get wrong) while leaving the transport pluggable:
 * call `setAnalyticsSink` once at startup to point events at a real backend.
 *
 * Until a sink is installed, events are logged in development and dropped in
 * production. Nothing here ever throws — analytics must not break a page.
 */

export type AnalyticsEventProps = Record<string, string | number | boolean>;

export interface AnalyticsEvent {
  name: string;
  props?: AnalyticsEventProps;
}

export type AnalyticsSink = (event: AnalyticsEvent) => void;

/** Event names used across the app, kept in one place so they stay consistent. */
export const analyticsEvents = {
  contactSubmit: 'contact_submit',
  contactSuccess: 'contact_success',
  contactError: 'contact_error',
  resumeDownload: 'resume_download',
  resumeOpen: 'resume_open',
} as const;

const devSink: AnalyticsSink = ({ name, props }) => {
  if (process.env.NODE_ENV !== 'development') return;
  console.debug('[analytics]', name, props ?? {});
};

let sink: AnalyticsSink = devSink;

/**
 * Replace the destination for `trackEvent`. Call once during app startup.
 * Passing `null` restores the default (dev-log / prod no-op) behaviour.
 */
export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next ?? devSink;
}

/**
 * Record a named interaction. Safe to call during render, on the server, or
 * before any sink is installed.
 */
export function trackEvent(name: string, props?: AnalyticsEventProps): void {
  try {
    sink({ name, props });
  } catch (error) {
    // An analytics failure is never worth taking a page down for.
    if (process.env.NODE_ENV === 'development') {
      console.warn('[analytics] sink threw', error);
    }
  }
}

/**
 * The `data-cf-beacon` payload for the Cloudflare beacon script.
 * `spa: true` makes the beacon report client-side route changes on its own.
 */
export function cloudflareBeaconConfig(token: string): string {
  return JSON.stringify({ token, spa: true });
}

export const cloudflareBeaconSrc =
  'https://static.cloudflareinsights.com/beacon.min.js';
