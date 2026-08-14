import { useRef, useState } from 'react';
import { Button } from 'components/Button';
import { Icon } from 'components/Icon';
import { Text } from 'components/Text';
import { Transition } from 'components/Transition';
import { useTheme } from 'components/ThemeProvider';
import styles from './Code.module.css';

interface CodeProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const Code = (props: CodeProps) => {
  const [copied, setCopied] = useState(false);
  const theme = useTheme();
  const elementRef = useRef<HTMLPreElement>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>();

  const lang = props.className?.split('-')[1];

  const handleCopy = () => {
    clearTimeout(copyTimeout.current);
    navigator.clipboard.writeText(elementRef.current?.textContent ?? '');

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className={styles.code} data-theme={theme.themeId}>
      {!!lang && (
        <Text secondary size="s" className={styles.lang}>
          {lang}
        </Text>
      )}
      <pre ref={elementRef} {...props} />
      <div className={styles.actions}>
        <Button iconOnly onClick={handleCopy} aria-label="Copy">
          <span className={styles.copyIcon}>
            <Transition in={!copied}>
              {(visible: boolean) => <Icon icon="copy" data-visible={visible} />}
            </Transition>
            <Transition in={copied}>
              {(visible: boolean) => <Icon icon="check" data-visible={visible} />}
            </Transition>
          </span>
        </Button>
      </div>
    </div>
  );
};
