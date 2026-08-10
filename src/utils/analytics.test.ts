import {
  cloudflareBeaconConfig,
  createBeaconSink,
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

describe('createBeaconSink', () => {
  const url = 'https://analytics.example.com';

  it('sends the event as JSON via sendBeacon when available', () => {
    const sendBeacon = jest.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    createBeaconSink(url)({ name: 'resume_open', props: { reason: 'x' } });

    expect(sendBeacon).toHaveBeenCalledWith(
      url,
      JSON.stringify({ name: 'resume_open', props: { reason: 'x' } })
    );
  });

  // When the user-agent queue is full sendBeacon returns false; we must not
  // silently drop the event.
  it('falls back to keepalive fetch when sendBeacon returns false', () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: jest.fn().mockReturnValue(false),
    });
    const fetchMock = jest.fn().mockResolvedValue({ status: 204 });
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    createBeaconSink(url)({ name: 'contact_submit' });

    expect(fetchMock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ method: 'POST', keepalive: true })
    );
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
