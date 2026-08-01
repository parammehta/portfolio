import { clamp } from 'utils/clamp';

describe('clamp', () => {
  it('returns the number when within both bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the lower bound', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to the upper bound', () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it('returns the bound values at the edges', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('treats a single bound as an upper cap', () => {
    expect(clamp(5, 2)).toBe(2); // above the cap -> clamped down
    expect(clamp(1, 2)).toBe(1); // below the cap -> unchanged
  });
});
