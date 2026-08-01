import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  // This is the standard usePrevious idiom: reading the ref during render
  // intentionally returns the value from before this render's effect runs.
  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}
