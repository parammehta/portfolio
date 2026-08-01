import { useCallback, useEffect, useRef, useState } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const dimensions = useRef<WindowSize>({ width: 1280, height: 800 });

  const createRuler = useCallback(() => {
    let ruler: HTMLDivElement | null = document.createElement('div');

    ruler.style.position = 'fixed';
    ruler.style.height = '100vh';
    ruler.style.width = '0';
    ruler.style.top = '0';

    document.documentElement.appendChild(ruler);

    // Set cache conscientious of device orientation
    dimensions.current.width = window.innerWidth;
    dimensions.current.height = ruler.offsetHeight;

    // Clean up after ourselves
    document.documentElement.removeChild(ruler);
    ruler = null;
  }, []);

  // Get the actual height on iOS Safari
  const getHeight = useCallback(() => {
    const isIOS = navigator?.userAgent.match(/iphone|ipod|ipad/i);

    if (isIOS) {
      createRuler();
      return dimensions.current.height;
    }

    return window.innerHeight;
  }, [createRuler]);

  const getSize = useCallback((): WindowSize => {
    return {
      width: window.innerWidth,
      height: getHeight(),
    };
  }, [getHeight]);

  // `dimensions.current` is a stable object reference, not changing
  // mutable data, so reading it here for useState's initial value is safe.
  // eslint-disable-next-line react-hooks/refs
  const [windowSize, setWindowSize] = useState<WindowSize>(dimensions.current);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(getSize());
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [getSize]);

  return windowSize;
}
