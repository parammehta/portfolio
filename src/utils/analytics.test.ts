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

  function beaconBody(sendBeacon: jest.Mock) {
    return JSON.parse(sendBeacon.mock.calls[0][1]);
  }

  function stubBeacon() {
    const sendBeacon = jest.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });
    return sendBeacon;
  }

  it('sends the event as JSON via sendBeacon when available', () => {
    const sendBeacon = stubBeacon();

    createBeaconSink(url)({ name: 'resume_open', props: { reason: 'x' } });

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon.mock.calls[0][0]).toBe(url);
    expect(beaconBody(sendBeacon)).toMatchObject({
      name: 'resume_open',
      props: { reason: 'x' },
    });
  });

  // The Worker can't derive the external referrer itself — the Referer header
  // on a beacon is our own page. Only the client sees document.referrer.
  it('attaches the referrer hostname when the visitor came from elsewhere', () => {
    const sendBeacon = stubBeacon();
    jest.spyOn(document, 'referrer', 'get').mockReturnValue('https://news.ycombinator.com/item?id=1');

    createBeaconSink(url)({ name: 'nav_link_click', props: { label: 'Resume' } });

    expect(beaconBody(sendBeacon).props).toMatchObject({
      label: 'Resume',
      ref: 'news.ycombinator.com',
    });
  });

  it('omits the referrer for same-origin navigation', () => {
    const sendBeacon = stubBeacon();
    jest
      .spyOn(document, 'referrer', 'get')
      .mockReturnValue(`${window.location.origin}/resume/`);

    createBeaconSink(url)({ name: 'nav_link_click' });

    expect(beaconBody(sendBeacon).props.ref).toBeUndefined();
  });

  it('reuses one session id across events in the same tab', () => {
    const sendBeacon = stubBeacon();
    const sink = createBeaconSink(url);

    sink({ name: 'contact_submit' });
    sink({ name: 'contact_success' });

    const first = JSON.parse(sendBeacon.mock.calls[0][1]).props.sid;
    const second = JSON.parse(sendBeacon.mock.calls[1][1]).props.sid;
    expect(first).toEqual(expect.any(String));
    expect(second).toBe(first);
  });

  // Safari's private mode throws on sessionStorage; an event with no session
  // id is still an event worth recording.
  it('still sends the event when sessionStorage is unavailable', () => {
    const sendBeacon = stubBeacon();
    const real = window.sessionStorage;
    // Reading the property itself throws in locked-down privacy modes, so
    // replace the whole object rather than spying on one method.
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('denied');
      },
    });

    try {
      createBeaconSink(url)({ name: 'contact_submit' });
    } finally {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: real,
      });
    }

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(beaconBody(sendBeacon).props.sid).toBeUndefined();
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
