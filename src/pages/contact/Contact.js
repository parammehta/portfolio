import { useRef, useState } from 'react';
import {
  Breadcrumbs,
  Button,
  DecoderText,
  Divider,
  Footer,
  Heading,
  Icon,
  Input,
  Meta,
  Section,
  Text,
  Transition,
} from 'components';
import styles from './Contact.module.css';
import { tokens } from 'components/ThemeProvider';
import { useFormInput } from 'hooks';
import { cssProps, msToNum, numToMs } from 'utils/style';

export const Contact = () => {
  const errorRef = useRef();
  const email = useFormInput('');
  const message = useFormInput('');
  const [sending, setSending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [statusError, setStatusError] = useState('');
  const initDelay = tokens.base.durationS;

  const name = useFormInput('');

  const onSubmit = async event => {
    event.preventDefault();
    setStatusError('');

    if (sending) return;

    // Silently succeed without sending if the honeypot field was filled in by a bot
    if (name.value) {
      setComplete(true);
      return;
    }

    try {
      setSending(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.value,
          email: email.value,
          message: message.value,
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
    } catch (error) {
      setSending(false);
      setStatusError(error.message);
    }
  };

  return (
    <>
      <Meta
        title="Contact"
        description="Send me a message if you're interested in discussing a project, an opportunity, or just want to say hello."
      />
      <Section className={styles.contact}>
        <Breadcrumbs
          className={styles.breadcrumbs}
          items={[
            { label: 'Home', href: '/' },
            { label: 'Contact', href: '/contact' },
          ]}
        />
        <Transition unmount in={!complete} timeout={1600}>
          {(visible, status) => (
            <form className={styles.form} method="post" onSubmit={onSubmit}>
              <Heading
                className={styles.title}
                data-status={status}
                level={3}
                as="h1"
                style={getDelay(tokens.base.durationXS, initDelay, 0.3)}
              >
                <DecoderText text="Say hello" start={status !== 'exited'} delay={300} />
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
                maxLength={512}
                {...email}
              />
              <Input
                required
                multiline
                className={styles.input}
                data-status={status}
                style={getDelay(tokens.base.durationS, initDelay)}
                autoComplete="off"
                label="Message"
                maxLength={4096}
                {...message}
              />
              <Transition in={statusError} timeout={msToNum(tokens.base.durationM)}>
                {errorStatus => (
                  <div
                    className={styles.formError}
                    data-status={errorStatus}
                    style={cssProps({
                      height: errorStatus ? errorRef.current?.offsetHeight : 0,
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
            </form>
          )}
        </Transition>
        <Transition unmount in={complete}>
          {(visible, status) => (
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
                href="/"
                icon="chevronRight"
              >
                Back to Home
              </Button>
            </div>
          )}
        </Transition>
      </Section>
      <Footer />
    </>
  );
};

function getStatusError({
  status,
  errorMessage,
  fallback = 'There was a problem with your request',
}) {
  if (status === 200) return false;

  const statuses = {
    500: 'There was a problem with the server, try again later',
    404: 'There was a problem connecting to the server. Make sure you are connected to the internet',
  };

  if (errorMessage) {
    return errorMessage;
  }

  return statuses[status] || fallback;
}

function getDelay(delayMs, offset = numToMs(0), multiplier = 1) {
  const numDelay = msToNum(delayMs) * multiplier;
  return cssProps({ delay: numToMs((msToNum(offset) + numDelay).toFixed(0)) });
}
