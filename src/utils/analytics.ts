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
  schedulingOpen: 'scheduling_open',
  resumeDownload: 'resume_download',
  resumeOpen: 'resume_open',
  designSystemOpen: 'design_system_open',
  navLinkClick: 'nav_link_click',
  socialLinkClick: 'social_link_click',
  themeToggle: 'theme_toggle',
  contactCtaClick: 'contact_cta_click',
  homeExperienceSlide: 'home_experience_slide',
  experienceTabSelect: 'experience_tab_select',
  experienceDetailsClick: 'experience_details_click',
  skillsToolLinkClick: 'skills_tool_link_click',
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

const SESSION_KEY = 'pm_sid';

/**
 * The hostname that sent this visitor here, or '' when they arrived directly
 * or from one of our own pages.
 *
 * The Worker can't derive this itself: the `Referer` header on a beacon is the
 * page the event fired on (our own URL), not the external source. Only the
 * client knows `document.referrer`, and only on the entry page — after a
 * client-side route change it still reports the original external source,
 * which is exactly what we want.
 */
function referrerHost(): string {
  try {
    const raw = document.referrer;
    if (!raw) return '';
    const { hostname } = new URL(raw);
    return hostname === window.location.hostname ? '' : hostname;
  } catch {
    return '';
  }
}

/**
 * A per-tab session id, so the dashboard can count sessions as well as
 * visitors. `sessionStorage` gives us the tab lifetime for free; it throws in
 * some privacy modes, in which case events simply go out without a session id
 * and the dashboard shows that dimension as partially covered.
 */
function sessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = Math.random().toString(36).slice(2, 12);
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return '';
  }
}

/**
 * A sink that ships events to the analytics Worker (Cloudflare Analytics
 * Engine). Uses `navigator.sendBeacon` so the request survives the page
 * navigations that some tracked interactions trigger (resume download, opening
 * a link in a new tab); falls back to `fetch(..., { keepalive })`.
 *
 * Every event also carries `ref` (external referrer host) and `sid` (tab
 * session), which the Worker stores alongside the event's own props.
 *
 * The body is a plain JSON string, which `sendBeacon` sends as text/plain — a
 * CORS "simple request", so no preflight. The Worker parses it as JSON.
 */
export function createBeaconSink(url: string): AnalyticsSink {
  return ({ name, props }) => {
    const context: AnalyticsEventProps = {};
    const ref = referrerHost();
    const sid = sessionId();
    if (ref) context.ref = ref;
    if (sid) context.sid = sid;

    const body = JSON.stringify({ name, props: { ...context, ...props } });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // Returns false if the user-agent queue is full; fall through to fetch.
      if (navigator.sendBeacon(url, body)) return;
    }

    void fetch(url, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
    }).catch(() => {
      // Fire-and-forget: a dropped analytics event is not worth surfacing.
    });
  };
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
