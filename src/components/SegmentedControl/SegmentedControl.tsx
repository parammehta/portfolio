import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { VisuallyHidden } from 'components/VisuallyHidden';
import { cssProps } from 'utils/style';
import styles from './SegmentedControl.module.css';

interface SegmentedControlContextValue {
  optionRefs: { current: RefObject<HTMLButtonElement>[] };
  currentIndex: number;
  onChange: (index: number) => void;
  registerOption: (optionRef: RefObject<HTMLButtonElement>) => void;
  unRegisterOption: (optionRef: RefObject<HTMLButtonElement>) => void;
}

const SegmentedControlContext = createContext<SegmentedControlContextValue>(
  {} as SegmentedControlContextValue
);

interface SegmentedControlProps {
  children: ReactNode;
  currentIndex: number;
  onChange: (index: number) => void;
  label: string;
  [key: string]: unknown;
}

export const SegmentedControl = ({
  children,
  currentIndex,
  onChange,
  label,
  ...props
}: SegmentedControlProps) => {
  const id = useId();
  const labelId = `${id}segmented-control-label`;
  const optionRefs = useRef<RefObject<HTMLButtonElement>[]>([]);
  const [indicator, setIndicator] = useState<{ width?: number; left?: number }>();

  const handleKeyDown = (event: KeyboardEvent) => {
    const { length } = optionRefs.current;
    const prevIndex = (currentIndex - 1 + length) % length;
    const nextIndex = (currentIndex + 1) % length;

    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) {
      onChange(prevIndex);
      optionRefs.current[prevIndex].current?.focus();
    } else if (['ArrowRight', 'ArrowDown'].includes(event.key)) {
      onChange(nextIndex);
      optionRefs.current[nextIndex].current?.focus();
    }
  };

  const registerOption = useCallback((optionRef: RefObject<HTMLButtonElement>) => {
    optionRefs.current = [...optionRefs.current, optionRef];
  }, []);

  const unRegisterOption = useCallback((optionRef: RefObject<HTMLButtonElement>) => {
    optionRefs.current = optionRefs.current.filter(ref => ref !== optionRef);
  }, []);

  useEffect(() => {
    const currentOption = optionRefs.current[currentIndex]?.current;
    if (!currentOption) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = currentOption.getBoundingClientRect();
      const left = currentOption.offsetLeft;
      setIndicator({ width: rect.width, left });
    });

    resizeObserver.observe(currentOption);

    return () => {
      resizeObserver.disconnect();
    };
  }, [currentIndex]);

  return (
    <SegmentedControlContext.Provider
      value={{ optionRefs, currentIndex, onChange, registerOption, unRegisterOption }}
    >
      <div
        className={styles.container}
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <VisuallyHidden as="label" id={labelId}>
          {label}
        </VisuallyHidden>
        <div className={styles.options}>
          {!!indicator && (
            <div
              className={styles.indicator}
              // Options register themselves into this ref on mount; length is
              // correct by the time this re-renders after registration settles.
              // eslint-disable-next-line react-hooks/refs
              data-last={currentIndex === optionRefs.current.length - 1}
              style={cssProps(indicator)}
            />
          )}
          {children}
        </div>
      </div>
    </SegmentedControlContext.Provider>
  );
};

interface SegmentedControlOptionProps {
  children: ReactNode;
  [key: string]: unknown;
}

export const SegmentedControlOption = ({ children, ...props }: SegmentedControlOptionProps) => {
  const { optionRefs, currentIndex, onChange, registerOption, unRegisterOption } =
    useContext(SegmentedControlContext);
  const optionRef = useRef<HTMLButtonElement>(null);
  // Same as above: the parent's ref collection settles by the time this
  // re-renders after this option registers itself on mount.
  // eslint-disable-next-line react-hooks/refs
  const index = optionRefs.current.indexOf(optionRef as RefObject<HTMLButtonElement>);
  const isSelected = currentIndex === index;

  useEffect(() => {
    registerOption(optionRef as RefObject<HTMLButtonElement>);

    return () => {
      unRegisterOption(optionRef as RefObject<HTMLButtonElement>);
    };
  }, [registerOption, unRegisterOption]);

  return (
    <button
      className={styles.button}
      tabIndex={isSelected ? 0 : -1}
      role="radio"
      aria-checked={isSelected}
      onClick={() => onChange(index)}
      ref={optionRef}
      {...props}
    >
      {children}
    </button>
  );
};
