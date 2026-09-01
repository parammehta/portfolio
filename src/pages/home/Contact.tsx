import {
  type FormEvent,
  type MouseEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import Script from 'next/script';
import { Footer } from 'components';
import {
  Button,
  ScrambleReveal,
  Divider,
  Heading,
  Icon,
  Input,
  Section,
  Text,
  Transition,
  tokens,
} from 'refract-ui';
import styles from './Contact.module.css';
import { useFormInput, useScrollToHash } from 'hooks';
import { analyticsEvents, trackEvent } from 'utils/analytics';
import { cssProps, msToNum, numToMs } from 'utils/style';

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const schedulingUrl =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1rYjKW8kCvg2D-PvqkY8RTEOAsY7QYYJ7rCDi8nmdTBmpm46ybaM3SKXfBE11e6_LDj0BKJK51?gv=true';

interface ContactProps {
  id: string;
  sectionRef?: RefObject<HTMLElement | null>;
}

export const Contact = ({ id, sectionRef }: ContactProps) => {
  const errorRef = useRef<HTMLDivElement>(null);
  const scrollToHash = useScrollToHash();
  const titleId = `${id}-title`;
  const email = useFormInput('');
  const message = useFormInput('');
  const [sending, setSending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [statusError, setStatusError] = useState('');
  const initDelay = tokens.base.durationS;

  const name = useFormInput('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!scriptLoaded || !turnstileRef.current) return;

    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
      callback: setTurnstileToken,
      'expired-callback': () => setTurnstileToken(''),
      'error-callback': () => setTurnstileToken(''),
      theme: 'auto',
    });

    return () => {
      if (turnstileWidgetId.current != null) {
        window.turnstile?.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, [scriptLoaded]);

  const handleBackToTop = (event: MouseEvent) => {
    event.preventDefault();
    scrollToHash('#intro');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusError('');

    if (sending) return;

    // Honeypot hit — show the success state to the bot, but don't report it as
    // a real submission.
    if (name.value) {
      setComplete(true);
      return;
    }

    if (process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && !turnstileToken) {
      setStatusError('Security check not complete. Please wait a moment and try again.');
      trackEvent(analyticsEvents.contactError, { reason: 'turnstile_incomplete' });
      return;
    }

    trackEvent(analyticsEvents.contactSubmit);

    try {
      setSending(true);

      // Same-origin now that the handler ships with the site as a Vercel
      // function (src/pages/api/message.api.ts). It used to be an absolute
      // NEXT_PUBLIC_API_URL pointing at the API Gateway in front of the Lambda,
      // which is why this was a `mode: 'cors'` request.
      //
      // The trailing slash is load-bearing: `trailingSlash: true` in
      // next.config.js applies to API routes as well as pages, so '/api/message'
      // answers with a 308 to '/api/message/'. fetch would follow it and the
      // form would still work, but every submission would pay for two requests.
      const response = await fetch('/api/message/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.value,
          email: email.value,
          message: message.value,
          turnstileToken,
        }),
      });

      const responseMessage = await response.json();

      const statusError = getStatusError({
        status: response?.status,
        errorMessage: responseMessage?.error,
        fallback: 'There was a problem sending your message',
      });

      if (statusError) throw new Error(statusError);

      setComplete(true);
      setSending(false);
      trackEvent(analyticsEvents.contactSuccess);
    } catch (error) {
      setSending(false);
      setStatusError((error as Error).message);
      trackEvent(analyticsEvents.contactError, { reason: 'request_failed' });
      window.turnstile?.reset(turnstileWidgetId.current!);
      setTurnstileToken('');
    }
  };

  return (
    <>
      {process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          onLoad={() => setScriptLoaded(true)}
        />
      )}
      <Section
        as="section"
        className={styles.contact}
        id={id}
        ref={sectionRef}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <a
          href="mailto:param.mehta95@gmail.com"
          className={styles.emailSide}
          aria-label="Send email to param.mehta95@gmail.com"
        >
          param.mehta95@gmail.com
        </a>
        <div className={styles.formWrapper}>
          <Transition unmount in={!complete} timeout={1600}>
            {(visible: boolean, status: string) => (
              <form className={styles.form} method="post" onSubmit={onSubmit}>
                <Heading
                  className={styles.title}
                  data-status={status}
                  level={3}
                  as="h2"
                  id={titleId}
                  style={getDelay(tokens.base.durationXS, initDelay, 0.3)}
                >
                  <ScrambleReveal
                    text="Say hello"
                    start={status !== 'exited'}
                    delay={300}
                  />
                </Heading>
                <Divider
                  className={styles.divider}
                  data-status={status}
                  style={getDelay(tokens.base.durationXS, initDelay, 0.4)}
                />
                {/* Hidden honeypot field to identify bots */}
                <Input
                  className={styles.botkiller}
                  label="Name"
                  maxLength={512}
                  {...name}
                />
                <Input
                  required
                  className={styles.input}
                  data-status={status}
                  style={getDelay(tokens.base.durationXS, initDelay)}
                  autoComplete="email"
                  label="Your Email"
                  type="email"
                  placeholder="you@example.com"
                  maxLength={512}
                  {...email}
                />
                <Input
                  required
                  multiline
                  maxRows={6}
                  className={styles.input}
                  data-status={status}
                  style={getDelay(tokens.base.durationS, initDelay)}
                  autoComplete="off"
                  label="Message"
                  placeholder="A project, a role, or just say hi…"
                  maxLength={4096}
                  {...message}
                />
                {process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && (
                  <div
                    ref={turnstileRef}
                    className={styles.turnstile}
                    data-status={status}
                    style={getDelay(tokens.base.durationS, initDelay, 1.5)}
                  />
                )}
                <Transition in={!!statusError} timeout={msToNum(tokens.base.durationM)}>
                  {(errorStatus: boolean) => (
                    <div
                      className={styles.formError}
                      data-status={errorStatus}
                      style={cssProps({
                        height: errorStatus ? (errorRef.current?.offsetHeight ?? 0) : 0,
                      })}
                    >
                      <div className={styles.formErrorContent} ref={errorRef}>
                        <div className={styles.formErrorMessage}>
                          <Icon className={styles.formErrorIcon} icon="error" />
                          {statusError}
                        </div>
                      </div>
                    </div>
                  )}
                </Transition>
                <div className={styles.actions}>
                  <Button
                    className={styles.button}
                    data-status={status}
                    data-sending={sending}
                    style={getDelay(tokens.base.durationM, initDelay)}
                    disabled={sending}
                    loading={sending}
                    loadingText="Sending..."
                    icon="send"
                    type="submit"
                  >
                    Send message
                  </Button>
                  <Button
                    secondary
                    className={styles.scheduling}
                    data-status={status}
                    style={getDelay(tokens.base.durationM, initDelay, 1.5)}
                    href={schedulingUrl}
                    icon="link"
                    onClick={() => trackEvent(analyticsEvents.schedulingOpen)}
                  >
                    Book a chat
                  </Button>
                </div>
              </form>
            )}
          </Transition>
          <Transition unmount in={complete} timeout={msToNum(tokens.base.durationXL)}>
            {(visible: boolean, status: string) => (
              <div className={styles.complete} aria-live="polite">
                <Heading
                  level={3}
                  as="h3"
                  className={styles.completeTitle}
                  data-status={status}
                >
                  Message Sent
                </Heading>
                <Text
                  size="l"
                  as="p"
                  className={styles.completeText}
                  data-status={status}
                  style={getDelay(tokens.base.durationXS)}
                >
                  I’ll get back to you within a couple days, sit tight
                </Text>
                <Button
                  secondary
                  iconHoverShift
                  className={styles.completeButton}
                  data-status={status}
                  style={getDelay(tokens.base.durationM)}
                  href="/#intro"
                  icon="chevronRight"
                  onClick={handleBackToTop}
                >
                  Back to top
                </Button>
              </div>
            )}
          </Transition>
        </div>
        <Footer className={styles.footer} />
      </Section>
    </>
  );
};

function getStatusError({
  status,
  errorMessage,
  fallback = 'There was a problem with your request',
}: {
  status: number;
  errorMessage?: string;
  fallback?: string;
}): string | false {
  if (status === 200) return false;

  const statuses: Record<number, string> = {
    500: 'There was a problem with the server, try again later',
    404: 'There was a problem connecting to the server. Make sure you are connected to the internet',
  };

  if (errorMessage) {
    return errorMessage;
  }

  return statuses[status] || fallback;
}

function getDelay(delayMs: string, offset: string = numToMs(0), multiplier: number = 1) {
  const numDelay = msToNum(delayMs) * multiplier;
  return cssProps({ delay: numToMs(Number((msToNum(offset) + numDelay).toFixed(0))) });
}
