import { formatTimecode, zeroPrefix } from 'utils/timecode';

describe('zeroPrefix', () => {
  it('pads single-digit numbers with a leading zero', () => {
    expect(zeroPrefix(0)).toBe('00');
    expect(zeroPrefix(9)).toBe('09');
  });

  it('leaves numbers of 10 or more unpadded', () => {
    expect(zeroPrefix(10)).toBe('10');
    expect(zeroPrefix(59)).toBe('59');
  });
});

describe('formatTimecode', () => {
  it('formats zero as an all-zero timecode', () => {
    expect(formatTimecode(0)).toBe('00:00:00:00');
  });

  it('formats a whole number of seconds', () => {
    // 5 seconds
    expect(formatTimecode(5 * 1000)).toBe('00:00:05:00');
  });

  it('formats minutes (1.5 hours)', () => {
    expect(formatTimecode(90 * 60 * 1000)).toBe('01:30:00:00');
  });

  it('formats hours', () => {
    expect(formatTimecode(60 * 60 * 1000)).toBe('01:00:00:00');
  });

  it('always returns four colon-separated two-digit groups', () => {
    expect(formatTimecode(276000)).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/);
  });
});
