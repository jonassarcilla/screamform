import { describe, test, expect } from 'bun:test';
import { deepFreeze } from '@screamform/core/utils/deep-freeze';

describe('Utils: deepFreeze', () => {
	test('should freeze a simple object', () => {
		const obj = { name: 'John', age: 30 };
		const frozen = deepFreeze(obj);
		expect(Object.isFrozen(frozen)).toBe(true);
		expect(frozen).toBe(obj); // same reference
	});

	test('should freeze nested objects', () => {
		const obj = {
			user: {
				profile: { city: 'NYC' },
			},
		};
		deepFreeze(obj);
		expect(Object.isFrozen(obj)).toBe(true);
		expect(Object.isFrozen(obj.user)).toBe(true);
		expect(Object.isFrozen(obj.user.profile)).toBe(true);
	});

	test('should freeze arrays', () => {
		const obj = {
			tags: ['a', 'b', 'c'],
			items: [{ id: 1 }, { id: 2 }],
		};
		deepFreeze(obj);
		expect(Object.isFrozen(obj.tags)).toBe(true);
		expect(Object.isFrozen(obj.items)).toBe(true);
		expect(Object.isFrozen(obj.items[0])).toBe(true);
	});

	test('should not throw on null values', () => {
		const obj = { name: null, count: 0, active: false };
		expect(() => deepFreeze(obj)).not.toThrow();
		expect(Object.isFrozen(obj)).toBe(true);
	});

	test('should handle deeply nested structures', () => {
		const obj = { a: { b: { c: { d: { e: 'deep' } } } } };
		deepFreeze(obj);
		expect(Object.isFrozen(obj.a.b.c.d)).toBe(true);
	});

	test('should prevent mutation after freezing', () => {
		const obj = { name: 'John', nested: { value: 1 } };
		deepFreeze(obj);
		// In strict mode these would throw; in sloppy mode they silently fail
		expect(() => {
			(obj as Record<string, unknown>).name = 'Jane';
		}).toThrow();
		expect(obj.name).toBe('John');
	});

	test('should handle empty objects', () => {
		const obj = {};
		deepFreeze(obj);
		expect(Object.isFrozen(obj)).toBe(true);
	});

	test('should handle UISchema-like structure', () => {
		const schema = {
			meta: { version: '1.0.0' },
			fields: {
				name: { label: 'Name', widget: 'text' },
				address: {
					label: 'Address',
					widget: 'section',
					itemSchema: {
						city: { label: 'City', widget: 'text' },
					},
				},
			},
		};
		deepFreeze(schema);
		expect(Object.isFrozen(schema.meta)).toBe(true);
		expect(Object.isFrozen(schema.fields.name)).toBe(true);
		expect(Object.isFrozen(schema.fields.address.itemSchema)).toBe(true);
		expect(Object.isFrozen(schema.fields.address.itemSchema?.city)).toBe(true);
	});

	test('should not re-freeze already frozen objects', () => {
		const inner = Object.freeze({ value: 1 });
		const obj = { inner, other: 2 };
		// Should not throw or infinite loop
		expect(() => deepFreeze(obj)).not.toThrow();
	});
});
