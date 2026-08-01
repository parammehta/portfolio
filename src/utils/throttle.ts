export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  timeFrame: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return function (...args: Parameters<T>): void {
    const now = Date.now();

    if (now - lastTime >= timeFrame) {
      func(...args);
      lastTime = now;
    }
  };
}
