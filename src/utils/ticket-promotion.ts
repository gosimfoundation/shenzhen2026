// Conference dates and ticket deadlines use Shenzhen time, independent of the visitor's timezone.
export const EARLY_BIRD_DEADLINE = '2026-09-17T23:55:00+08:00';
export const TICKET_SALES_DEADLINE = '2026-10-17T18:00:00+08:00';
export const CONFERENCE_START = '2026-10-16T00:00:00+08:00';

export function conferenceDaysRemaining(now = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(CONFERENCE_START) - now) / 86_400_000));
}

export function ticketPromotionPhase(now = Date.now()): 'early' | 'standard' | 'closed' {
  if (now < Date.parse(EARLY_BIRD_DEADLINE)) return 'early';
  if (now < Date.parse(TICKET_SALES_DEADLINE)) return 'standard';
  return 'closed';
}
