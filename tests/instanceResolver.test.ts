import { describe, expect, test } from 'bun:test';
import { InstanceResolver } from '../src/sync/instanceResolver';
import type { ConfluenceInstance, SyncTarget } from '../src/types';

const instances: ConfluenceInstance[] = [
	{
		id: 'a',
		name: 'A',
		baseUrl: 'https://a.example/wiki',
		authType: 'basic',
		username: 'a',
		apiToken: 'a-token',
		stripSupplementaryChars: false,
	},
	{
		id: 'b',
		name: 'B',
		baseUrl: 'https://b.example/wiki',
		authType: 'basic',
		username: 'b',
		apiToken: 'b-token',
		stripSupplementaryChars: false,
	},
];

const resolver = new InstanceResolver({ instances });

describe('multi-instance target routing', () => {
	test('existing page URL is authoritative over a stale parent URL', () => {
		const target: SyncTarget = {
			url: 'https://a.example/wiki/pages/123/Page',
			parentUrl: 'https://b.example/wiki/pages/999/Parent',
			pageId: '123',
		};

		expect(resolver.resolveTarget(target)?.id).toBe('a');
	});

	test('parent URL owns a target only before the child page exists', () => {
		const target: SyncTarget = {
			url: '',
			parentUrl: 'https://b.example/wiki/pages/999/Parent',
			pageId: '',
		};

		expect(resolver.resolveTarget(target)?.id).toBe('b');
	});

	test('one engine reports a partially unmatched target instead of hiding it as foreign', () => {
		const targets: SyncTarget[] = [
			{ url: 'https://a.example/wiki/pages/123/Page', pageId: '123' },
			{ url: 'https://unknown.example/wiki/pages/456/Page', pageId: '456' },
		];

		expect(resolver.partitionTargets(targets, 'a')).toEqual({
			ownedIndices: [0],
			foreignIndices: [],
			unmatchedIndices: [1],
			ignoredIndices: [],
		});
		expect(resolver.partitionTargets(targets, 'b')).toEqual({
			ownedIndices: [],
			foreignIndices: [0, 1],
			unmatchedIndices: [],
			ignoredIndices: [],
		});
	});

	test('grouping honors the configured URL key and does not route an existing page by parentUrl', () => {
		const file = { path: 'mixed.md' };
		const app = {
			metadataCache: {
				getFileCache: () => ({
					frontmatter: {
					cf_url: ['https://a.example/wiki/pages/123/Page'],
						confluence_parent_url: ['https://b.example/wiki/pages/999/Parent'],
						confluence_page_id: ['123'],
					},
				}),
			},
		};

		const result = resolver.groupByInstance(
			[file] as never[],
			app as never,
			'cf_url',
		);

		expect([...result.groups.keys()]).toEqual(['a']);
		expect(result.unmatched).toEqual([]);
	});

	test('wikilinks resolve to the target URL owned by the current instance', () => {
		const targets: SyncTarget[] = [
			{ url: 'https://a.example/wiki/pages/123/A', pageId: '123' },
			{ url: 'https://b.example/wiki/pages/456/B', pageId: '456' },
		];

		expect(resolver.findTargetUrlForInstance(targets, 'a')).toContain('/123/');
		expect(resolver.findTargetUrlForInstance(targets, 'b')).toContain('/456/');
	});
});
