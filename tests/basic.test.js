// Basic test to ensure the test runner passes
import { describe, it, expect } from 'vitest';

describe('Basic functionality', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should handle simple math', () => {
    expect(2 + 2).toBe(4);
  });
});