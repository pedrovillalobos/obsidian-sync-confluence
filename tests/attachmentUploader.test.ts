import { describe, expect, test } from 'bun:test';
import { shouldSkipBeforeRead } from '../src/confluence/attachmentUploader';

const TEN_MB = 10 * 1024 * 1024;

describe('shouldSkipBeforeRead', () => {
	test('skips when stat.size is above the limit', () => {
		expect(shouldSkipBeforeRead(TEN_MB + 1, TEN_MB)).toBe(true);
	});

	test('does not skip when stat.size is at or under the limit', () => {
		expect(shouldSkipBeforeRead(TEN_MB, TEN_MB)).toBe(false);
		expect(shouldSkipBeforeRead(1, TEN_MB)).toBe(false);
	});

	test('does not skip when stat is missing so the post-read check can run', () => {
		expect(shouldSkipBeforeRead(undefined, TEN_MB)).toBe(false);
		expect(shouldSkipBeforeRead(Number.NaN, TEN_MB)).toBe(false);
	});
});
