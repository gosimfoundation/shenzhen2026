import { describe, expect, it } from 'vitest';
import { ticketPromotionPhase } from '../src/utils/ticket-promotion';

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
