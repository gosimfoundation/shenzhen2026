import { describe, expect, it } from 'vitest';
import { moveItem, validDraft, type BoardItem } from '../src/utils/sponsor-board';
const items: BoardItem[] = [
  { id: 'a', category: 'gold', name: 'A', image: '' },
  { id: 'b', category: 'gold', name: 'B', image: '' },
  { id: 'c', category: 'silver', name: 'C', image: '' },
];
describe('sponsor draft placement', () => {
  it('moves within a tier without mutating the undo snapshot', () => {
    expect(moveItem(items, 'b', 'gold', 'a').map(i => i.id)).toEqual(['b', 'a', 'c']);
    expect(items.map(i => i.id)).toEqual(['a', 'b', 'c']);
  });
  it('moves between tiers before the target and retains image/name', () => {
    const next = moveItem(items, 'a', 'silver', 'c');
    expect(next.filter(i => i.category === 'silver').map(i => i.id)).toEqual(['a', 'c']);
    expect(next.find(i => i.id === 'a')).toEqual({ ...items[0], category: 'silver' });
  });
  it('supports an empty tier and dropping after the last card', () => {
    expect(moveItem(items, 'a', 'chief').at(-1)?.category).toBe('chief');
    expect(moveItem(items, 'a', 'gold').filter(i => i.category === 'gold').map(i => i.id)).toEqual(['b', 'a']);
  });
  it('does not lose cards when dropping on self or an unknown card', () => {
    expect(moveItem(items, 'a', 'gold', 'a')).toBe(items);
    expect(moveItem(items, 'missing', 'gold')).toBe(items);
  });
  it('validates persisted drafts, including a deliberately empty board', () => {
    expect(validDraft(items, ['gold', 'silver'])).toBe(true);
    expect(validDraft([], ['gold'])).toBe(true);
    expect(validDraft([...items, items[0]], ['gold', 'silver'])).toBe(false);
    expect(validDraft([{ ...items[0], image: 'javascript:alert(1)' }], ['gold'])).toBe(false);
    expect(validDraft([{ ...items[0], category: 'unknown' }], ['gold'])).toBe(false);
    expect(validDraft([{ ...items[0], image: '/images/sponsors/google.png' }], ['gold'])).toBe(true);
  });
});
