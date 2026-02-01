import { type UISchema } from '@screamform/core';
import { discardChanges } from '@screamform/core/use-cases/discard-changes';
import { describe, test, expect } from 'bun:test';

describe('Use Case: discardChanges', () => {
	test('discardChanges should prioritize committed data over defaults', () => {
		const schema: UISchema = {
			fields: {
				username: { label: 'User', widget: 'text', defaultValue: 'guest_user' },
			},
		};

		const committed = { username: 'existing_admin' };
		const dirty = { username: 'malicious_edit' };

		const result = discardChanges(schema, dirty, committed, 'username');
		expect(result.data.username).toBe('existing_admin');
	});

	test('discardChanges should use default if no committed data exists', () => {
		const schema: UISchema = {
			fields: {
				theme: { label: 'Theme', widget: 'text', defaultValue: 'dark' },
			},
		};

		const committed = {};
		const dirty = { theme: 'light' };

		const result = discardChanges(schema, dirty, committed, 'theme');
		expect(result.data.theme).toBe('dark');
	});

	test('discardChanges single field should use getFallbackValue when no committed or defaultValue', () => {
		const schema: UISchema = {
			fields: {
				name: { label: 'Name', widget: 'text' },
				active: { label: 'Active', widget: 'checkbox' },
				count: { label: 'Count', widget: 'number' },
				tags: { label: 'Tags', widget: 'multi-select' },
				meta: { label: 'Meta', widget: 'object' },
			},
		};

		const committed = {};
		const dirty = {
			name: 'x',
			active: true,
			count: 99,
			tags: ['a'],
			meta: { x: 1 },
		};

		expect(discardChanges(schema, dirty, committed, 'name').data.name).toBe('');
		expect(discardChanges(schema, dirty, committed, 'active').data.active).toBe(
			false,
		);
		expect(discardChanges(schema, dirty, committed, 'count').data.count).toBe(
			0,
		);
		expect(discardChanges(schema, dirty, committed, 'tags').data.tags).toEqual(
			[],
		);
		expect(discardChanges(schema, dirty, committed, 'meta').data.meta).toEqual(
			{},
		);
	});

	test('discardChanges without targetKey restores entire form to baseline', () => {
		const schema: UISchema = {
			fields: {
				username: { label: 'User', widget: 'text', defaultValue: 'guest' },
				role: { label: 'Role', widget: 'text' },
			},
		};

		const committed = { username: 'saved_user', role: 'admin' };
		const dirty = {
			username: 'dirty_user',
			role: 'dirty_role',
			extra: 'stale',
		};

		const result = discardChanges(schema, dirty, committed);

		expect(result.data).toEqual({
			username: 'saved_user',
			role: 'admin',
		});
		expect(result.data).not.toHaveProperty('extra');
	});

	test('discardChanges full form uses defaultValue when no committed value for a key', () => {
		const schema: UISchema = {
			fields: {
				a: { label: 'A', widget: 'text', defaultValue: 'default_a' },
				b: { label: 'B', widget: 'text' },
			},
		};

		const committed = { b: 'committed_b' };
		const dirty = { a: 'dirty_a', b: 'dirty_b' };

		const result = discardChanges(schema, dirty, committed);

		expect(result.data.a).toBe('default_a');
		expect(result.data.b).toBe('committed_b');
	});

	test('discardChanges full form uses getFallbackValue when no committed or default', () => {
		const schema: UISchema = {
			fields: {
				text: { label: 'Text', widget: 'text' },
				checked: { label: 'Checked', widget: 'checkbox' },
			},
		};

		const committed = {};
		const dirty = { text: 'x', checked: true };

		const result = discardChanges(schema, dirty, committed);

		expect(result.data.text).toBe('');
		expect(result.data.checked).toBe(false);
	});
});
