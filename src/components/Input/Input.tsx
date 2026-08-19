import React, { useId, useRef, useState } from 'react';
import type { ChangeEvent, ElementType, FocusEvent } from 'react';
import { Icon } from 'components/Icon';
import { tokens } from 'components/ThemeProvider';
import { Transition } from 'components/Transition';
import { classes, cssProps, msToNum } from 'utils/style';
import styles from './Input.module.css';
import { TextArea } from './TextArea';

export interface InputProps {
  id?: string;
  label?: string;
  value?: string;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  error?: string | null;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  type?: string;
  placeholder?: string;
  /** Multiline only: cap the auto-grow at this many rows, then scroll inside. */
  maxRows?: number;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  [key: string]: unknown;
}

export const Input = ({
  id,
  label,
  value,
  multiline,
  className,
  style,
  error,
  onBlur,
  autoComplete,
  required,
  maxLength,
  type,
  placeholder,
  maxRows,
  onChange,
  ...rest
}: InputProps) => {
  const [focused, setFocused] = useState(false);
  const generatedId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const inputId = id || `${generatedId}input`;
  const labelId = `${inputId}-label`;
  const errorId = `${inputId}-error`;
  const InputElement = (multiline ? TextArea : 'input') as ElementType;

  const handleBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFocused(false);

    if (onBlur) {
      onBlur(event);
    }
  };

  return (
    <div
      className={classes(styles.container, className)}
      data-error={!!error}
      data-multiline={!!multiline}
      style={style}
      {...rest}
    >
      <div className={styles.content}>
        <label
          className={styles.label}
          data-focused={focused}
          data-filled={!!value}
          data-placeholder={!!placeholder}
          id={labelId}
          htmlFor={inputId}
        >
          {label}
        </label>
        <InputElement
          className={styles.input}
          id={inputId}
          aria-labelledby={labelId}
          aria-describedby={error ? errorId : undefined}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          maxLength={maxLength}
          type={type}
          placeholder={placeholder}
          {...(multiline ? { maxRows } : {})}
        />
        <div className={styles.underline} data-focused={focused} />
      </div>
      <Transition unmount in={!!error} timeout={msToNum(tokens.base.durationM)}>
        {(visible: boolean) => (
          <div
            className={styles.error}
            data-visible={visible}
            id={errorId}
            role="alert"
            style={cssProps({
              height: visible ? errorRef.current?.getBoundingClientRect().height ?? 0 : 0,
            })}
          >
            <div className={styles.errorMessage} ref={errorRef}>
              <Icon icon="error" />
              {error}
            </div>
          </div>
        )}
      </Transition>
    </div>
  );
};
