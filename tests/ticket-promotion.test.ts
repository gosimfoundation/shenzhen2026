import { describe, expect, it } from 'vitest';
import { conferenceDaysRemaining, ticketPromotionPhase } from '../src/utils/ticket-promotion';

describe('conference countdown to October 16 in Shenzhen time', () => {
  it.each([
    ['2026-10-13T00:00:00+08:00', 3],
    ['2026-10-13T23:59:59+08:00', 3],
    ['2026-10-13T16:00:00Z', 2],
    ['2026-10-15T23:59:59+08:00', 1],
    ['2026-10-16T00:00:00+08:00', 0],
    ['2026-10-17T00:00:00+08:00', 0],
  ])('shows the remaining calendar days at %s', (now, days) => {
    expect(conferenceDaysRemaining(Date.parse(now))).toBe(days);
  });
});

describe('ticket promotion deadlines in Shenzhen time', () => {
  it('ends early-bird pricing exactly at the advertised cutoff', () => {
    expect(ticketPromotionPhase(Date.parse('2026-09-17T15:54:59Z'))).toBe('early');
    expect(ticketPromotionPhase(Date.parse('2026-09-17T15:55:00Z'))).toBe('standard');
  });
  it('removes the promotion when standard ticket sales end', () => {
    expect(ticketPromotionPhase(Date.parse('2026-10-17T09:59:59Z'))).toBe('standard');
    expect(ticketPromotionPhase(Date.parse('2026-10-17T10:00:00Z'))).toBe('closed');
  });
});
