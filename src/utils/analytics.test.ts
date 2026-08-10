import {
  cloudflareBeaconConfig,
  setAnalyticsSink,
  trackEvent,
  type AnalyticsEvent,
} from './analytics';

afterEach(() => {
  setAnalyticsSink(null);
  jest.restoreAllMocks();
});

describe('trackEvent', () => {
  it('forwards the name and props to the installed sink', () => {
    const events: AnalyticsEvent[] = [];
    setAnalyticsSink(event => events.push(event));

    trackEvent('resume_download');
    trackEvent('contact_error', { reason: 'request_failed' });

    expect(events).toEqual([
      { name: 'resume_download', props: undefined },
      { name: 'contact_error', props: { reason: 'request_failed' } },
    ]);
  });

  // A broken analytics backend must never take a page down with it.
  it('swallows errors thrown by the sink', () => {
    setAnalyticsSink(() => {
      throw new Error('transport exploded');
    });

    expect(() => trackEvent('contact_submit')).not.toThrow();
  });

  it('drops events once the sink is removed', () => {
    const sink = jest.fn();
    setAnalyticsSink(sink);
    setAnalyticsSink(null);

    trackEvent('contact_submit');

    expect(sink).not.toHaveBeenCalled();
  });
});

describe('cloudflareBeaconConfig', () => {
  // The beacon relies on spa mode to report client-side route changes; without
  // it the static export would only ever record the first pageview.
  it('enables spa mode alongside the token', () => {
    expect(JSON.parse(cloudflareBeaconConfig('abc123'))).toEqual({
      token: 'abc123',
      spa: true,
    });
  });
});
