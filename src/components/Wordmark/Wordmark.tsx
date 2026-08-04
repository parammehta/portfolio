import { forwardRef, useId, type SVGProps } from 'react';
import { classes } from 'utils/style';
import styles from './Wordmark.module.css';

export interface WordmarkProps extends SVGProps<SVGSVGElement> {
  highlight?: boolean;
}

export const Wordmark = forwardRef<SVGSVGElement, WordmarkProps>(
  ({ highlight, className, ...props }, ref) => {
    const id = useId();
    const clipId = `${id}wordmark-clip`;

    return (
      <svg
        aria-hidden
        className={classes(styles.wordmark, className)}
        width="46"
        height="29"
        viewBox="0 0 46 29"
        ref={ref}
        {...props}
      >
        <defs>
          <clipPath id={clipId}>
            <path
              d="M 10.3281 17.7888 l 4.4875 -11.4688 l 0.0019 -0.0006 l 6.075 11.5263 a 0.5238 0.5238 90 0 0 0.9525 -0.0581 l 2.1187 -5.515 a 0.5288 0.5288 90 0 0 -0.025 -0.4288 L 18.9419 2.2531 A 4.1863 4.1863 90 0 0 15.2294 0 h -2.875 a 0.525 0.525 90 0 0 -0.4625 0.7688 l 2.2687 4.3044 l -2.2844 5.7188 l -4.45 -8.5388 A 4.1863 4.1863 90 0 0 3.7138 0 h -2.875 a 0.5262 0.5262 90 0 0 -0.4675 0.7688 L 9.375 17.8462 a 0.5244 0.5244 90 0 0 0.9525 -0.0575 z M 26.495 5.5037 a 0.5219 0.5219 90 0 0 0.2419 -0.2787 v 0.0006 l 1.6687 -4.5188 a 0.5238 0.5238 90 0 0 -0.4906 -0.7056 h -4.1113 a 0.5231 0.5231 90 0 0 -0.46 0.7737 l 2.4419 4.5163 c 0.1375 0.2562 0.4556 0.35 0.7094 0.2125 z M 39.375 0 l 0 18.125 L 34.375 18.125 l 0 -11.875 A 4.1863 4.1863 90 0 0 34.375 18.125 L 34.375 18.125 L 34.375 0 z z"
              transform="rotate(180 23 15)"
            />
          </clipPath>
        </defs>
        <rect clipPath={`url(#${clipId})`} width="100%" height="100%" />
        {highlight && (
          <g clipPath={`url(#${clipId})`}>
            <rect className={styles.highlight} width="100%" height="100%" />
          </g>
        )}
      </svg>
    );
  }
);
