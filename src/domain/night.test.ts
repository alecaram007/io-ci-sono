import { describe, expect, it } from 'vitest';
import { getNightDate, getNightKey } from './night';

describe('night key lifecycle', () => {
  it('keeps late evening on the same local night', () => {
    const date = new Date('2026-05-10T21:30:00.000Z');
    expect(getNightDate(date, 'Europe/Rome')).toBe('2026-05-10');
    expect(getNightKey('Europe/Rome', date)).toBe('Europe/Rome:2026-05-10');
  });

  it('before 06:00 local time still belongs to the previous night', () => {
    const date = new Date('2026-05-11T02:30:00.000Z');
    expect(getNightDate(date, 'Europe/Rome')).toBe('2026-05-10');
  });

  it('after reset starts a new night', () => {
    const date = new Date('2026-05-11T05:00:00.000Z');
    expect(getNightDate(date, 'Europe/Rome')).toBe('2026-05-11');
  });
});
