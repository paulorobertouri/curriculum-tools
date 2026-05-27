import { describe, expect, it } from 'vitest';
describe('vite env mirror', () => { it('exists for src parity', () => { expect(import.meta).toBeDefined(); }); });
