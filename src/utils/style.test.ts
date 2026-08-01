import { classes, msToNum, numToMs } from 'utils/style';

describe('classes', () => {
  it('joins truthy class names with a space', () => {
    expect(classes('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(classes('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(classes(false, null, undefined)).toBe('');
  });
});

describe('ms <-> num helpers', () => {
  it('parses a millisecond string into a number', () => {
    expect(msToNum('300ms')).toBe(300);
  });

  it('formats a number into a millisecond string', () => {
    expect(numToMs(300)).toBe('300ms');
  });

  it('round-trips', () => {
    expect(msToNum(numToMs(150))).toBe(150);
  });
});
