import { type ComponentPropsWithoutRef } from 'react';
import { classes, cssProps, numToMs } from 'utils/style';
import styles from './Divider.module.css';

export interface DividerProps extends ComponentPropsWithoutRef<'div'> {
  lineWidth?: string;
  lineHeight?: string;
  notchWidth?: string;
  notchHeight?: string;
  collapseDelay?: number;
  collapsed?: boolean;
  notch?: boolean;
  light?: boolean;
}

export const Divider = ({
  lineWidth = '100%',
  lineHeight = '2px',
  notchWidth = '90px',
  notchHeight = '10px',
  collapseDelay = 0,
  collapsed = false,
  notch = true,
  light = false,
  className,
  style,
  ...rest
}: DividerProps) => (
  <div
    className={classes(styles.divider, className)}
    data-light={light}
    style={cssProps(
      {
        lineWidth: lineWidth,
        lineHeight: lineHeight,
        notchWidth: notchWidth,
        notchHeight: notchHeight,
        collapseDelay: numToMs(collapseDelay),
      },
      style
    )}
    {...rest}
  >
    <div className={styles.line} data-collapsed={collapsed} />
    {notch && (
      <div
        className={styles.notch}
        data-collapsed={collapsed}
        style={cssProps({ collapseDelay: numToMs(collapseDelay + 160) })}
      />
    )}
  </div>
);
