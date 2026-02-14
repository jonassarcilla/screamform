import { describe, test, expect } from 'bun:test';
import { PathResolver } from '@screamform/core/domain/transformation/path-resolver';

describe('Domain: PathResolver', () => {
	describe('get', () => {
		test('should retrieve simple property', () => {
			const obj = { name: 'John', age: 30 };
			expect(PathResolver.get(obj, 'name')).toBe('John');
			expect(PathResolver.get(obj, 'age')).toBe(30);
		});

		test('should retrieve nested property', () => {
			const obj = {
				user: {
					firstName: 'Jane',
					lastName: 'Doe',
					address: {
						city: 'Boston',
						zip: '02101',
					},
				},
			};
			expect(PathResolver.get(obj, 'user.firstName')).toBe('Jane');
			expect(PathResolver.get(obj, 'user.address.city')).toBe('Boston');
			expect(PathResolver.get(obj, 'user.address.zip')).toBe('02101');
		});

		test('should return undefined for empty path', () => {
			const obj = { name: 'John' };
			expect(PathResolver.get(obj, '')).toBeUndefined();
		});

		test('should return undefined for non-existent path', () => {
			const obj = { name: 'John' };
			expect(PathResolver.get(obj, 'missing')).toBeUndefined();
			expect(PathResolver.get(obj, 'user.firstName')).toBeUndefined();
		});

		test('should return undefined when traversing through non-object', () => {
			const obj = { name: 'John', age: 30 };
			expect(PathResolver.get(obj, 'age.invalid')).toBeUndefined();
		});

		test('should handle null and undefined values in path', () => {
			const obj = { user: null, profile: undefined };
			expect(PathResolver.get(obj, 'user.name')).toBeUndefined();
			expect(PathResolver.get(obj, 'profile.name')).toBeUndefined();
		});

		// --- Array index support ---

		test('should access array items using dot-numeric notation', () => {
			const obj = {
				contacts: [
					{ name: 'Alice', phone: '555-0001' },
					{ name: 'Bob', phone: '555-0002' },
				],
			};
			expect(PathResolver.get(obj, 'contacts.0.name')).toBe('Alice');
			expect(PathResolver.get(obj, 'contacts.1.phone')).toBe('555-0002');
		});

		test('should access array items using bracket notation', () => {
			const obj = {
				contacts: [
					{ name: 'Alice', phone: '555-0001' },
					{ name: 'Bob', phone: '555-0002' },
				],
			};
			expect(PathResolver.get(obj, 'contacts[0].name')).toBe('Alice');
			expect(PathResolver.get(obj, 'contacts[1].phone')).toBe('555-0002');
		});

		test('should access nested arrays with bracket notation', () => {
			const obj = {
				orders: [
					{
						items: [
							{ sku: 'ABC-123', qty: 2 },
							{ sku: 'DEF-456', qty: 1 },
						],
					},
				],
			};
			expect(PathResolver.get(obj, 'orders[0].items[0].sku')).toBe('ABC-123');
			expect(PathResolver.get(obj, 'orders[0].items[1].qty')).toBe(1);
		});

		test('should access primitive array items', () => {
			const obj = { tags: ['tag1', 'tag2', 'tag3'] };
			expect(PathResolver.get(obj, 'tags[0]')).toBe('tag1');
			expect(PathResolver.get(obj, 'tags.1')).toBe('tag2');
			expect(PathResolver.get(obj, 'tags[2]')).toBe('tag3');
		});

		test('should return undefined for out-of-bounds array index', () => {
			const obj = { items: ['a', 'b'] };
			expect(PathResolver.get(obj, 'items[5]')).toBeUndefined();
			expect(PathResolver.get(obj, 'items.99')).toBeUndefined();
		});

		test('should return undefined when indexing into non-array', () => {
			const obj = { name: 'John' };
			expect(PathResolver.get(obj, 'name.0')).toBeUndefined();
		});

		test('should handle deeply nested object-array mix', () => {
			const obj = {
				user: {
					contacts: [
						{
							address: {
								city: 'NYC',
								phones: ['555-0001', '555-0002'],
							},
						},
					],
				},
			};
			expect(PathResolver.get(obj, 'user.contacts[0].address.city')).toBe(
				'NYC',
			);
			expect(PathResolver.get(obj, 'user.contacts[0].address.phones[1]')).toBe(
				'555-0002',
			);
		});

		test('should return the whole array when path ends at array', () => {
			const obj = { tags: ['a', 'b', 'c'] };
			expect(PathResolver.get(obj, 'tags')).toEqual(['a', 'b', 'c']);
		});

		test('should return undefined for array index on empty array', () => {
			const obj = { items: [] as unknown[] };
			expect(PathResolver.get(obj, 'items[0]')).toBeUndefined();
		});
	});

	describe('set', () => {
		test('should set simple property', () => {
			const obj = { name: 'John' };
			const result = PathResolver.set(obj, 'age', 30);
			expect(result.age).toBe(30);
			expect(result.name).toBe('John');
		});

		test('should create nested structure when path does not exist', () => {
			const obj = { name: 'John' };
			const result = PathResolver.set(obj, 'user.firstName', 'Jane');
			expect(result.user).toBeDefined();
			expect((result.user as Record<string, unknown>).firstName).toBe('Jane');
		});

		test('should create deeply nested structure', () => {
			const obj = {};
			const result = PathResolver.set(obj, 'user.address.city', 'Boston');
			expect(result.user).toBeDefined();
			expect((result.user as Record<string, unknown>).address).toBeDefined();
			const address = (result.user as Record<string, unknown>)
				.address as Record<string, unknown>;
			expect(address.city).toBe('Boston');
		});

		test('should update existing nested property', () => {
			const obj = {
				user: {
					firstName: 'John',
					lastName: 'Doe',
				},
			};
			const result = PathResolver.set(obj, 'user.firstName', 'Jane');
			expect((result.user as Record<string, unknown>).firstName).toBe('Jane');
			expect((result.user as Record<string, unknown>).lastName).toBe('Doe');
		});

		test('should not mutate original object', () => {
			const obj = { name: 'John', age: 30 };
			const result = PathResolver.set(obj, 'age', 40);
			expect(obj.age).toBe(30); // Original unchanged
			expect(result.age).toBe(40); // New object changed
		});

		test('should replace non-object values in path with objects', () => {
			const obj = { user: 'not an object' };
			const result = PathResolver.set(obj, 'user.name', 'Jane');
			expect(typeof result.user).toBe('object');
			expect((result.user as Record<string, unknown>).name).toBe('Jane');
		});

		test('should handle setting value to null', () => {
			const obj = { name: 'John' };
			const result = PathResolver.set(obj, 'name', null);
			expect(result.name).toBeNull();
		});

		test('should handle setting value to undefined', () => {
			const obj = { name: 'John' };
			const result = PathResolver.set(obj, 'name', undefined);
			expect(result.name).toBeUndefined();
		});

		test('should handle empty string key in path gracefully', () => {
			const obj = { name: 'John' };
			// Edge case: path with empty parts like "user..name"
			const result = PathResolver.set(obj, 'user..name', 'Jane');
			expect(result).toBeDefined();
		});

		test('should handle single-level path', () => {
			const obj = { a: 1 };
			const result = PathResolver.set(obj, 'b', 2);
			expect(result.b).toBe(2);
			expect(result.a).toBe(1);
		});

		test('should spread and clone nested objects', () => {
			const nested = { city: 'Boston' };
			const obj = { user: { address: nested } };
			const result = PathResolver.set(obj, 'user.address.zip', '02101');

			// Original nested object should be unchanged
			expect(nested).not.toHaveProperty('zip');

			// Result should have the new property
			const address = (result.user as Record<string, unknown>)
				.address as Record<string, unknown>;
			expect(address.zip).toBe('02101');
			expect(address.city).toBe('Boston');
		});

		// --- Array index support ---

		test('should set value at array index using bracket notation', () => {
			const obj = { contacts: [{ name: 'Alice' }, { name: 'Bob' }] };
			const result = PathResolver.set(obj, 'contacts[0].name', 'Jane');
			expect(
				((result.contacts as unknown[])[0] as Record<string, unknown>).name,
			).toBe('Jane');
			// Original array item should be unchanged
			expect((obj.contacts[0] as Record<string, unknown>).name).toBe('Alice');
		});

		test('should set value at array index using dot-numeric notation', () => {
			const obj = { contacts: [{ name: 'Alice' }, { name: 'Bob' }] };
			const result = PathResolver.set(obj, 'contacts.1.name', 'Carol');
			expect(
				((result.contacts as unknown[])[1] as Record<string, unknown>).name,
			).toBe('Carol');
		});

		test('should create array when path has numeric next key and target does not exist', () => {
			const obj = {} as Record<string, unknown>;
			const result = PathResolver.set(obj, 'tags.0', 'first');
			expect(Array.isArray(result.tags)).toBe(true);
			expect((result.tags as unknown[])[0]).toBe('first');
		});

		test('should create nested arrays and objects', () => {
			const obj = {} as Record<string, unknown>;
			const result = PathResolver.set(obj, 'contacts[0].address.city', 'NYC');
			expect(Array.isArray(result.contacts)).toBe(true);
			const contact = (result.contacts as unknown[])[0] as Record<
				string,
				unknown
			>;
			expect(typeof contact.address).toBe('object');
			expect((contact.address as Record<string, unknown>).city).toBe('NYC');
		});

		test('should handle deeply nested array set', () => {
			const obj = {} as Record<string, unknown>;
			const result = PathResolver.set(obj, 'orders[0].items[0].sku', 'ABC-123');
			expect(Array.isArray(result.orders)).toBe(true);
			const order = (result.orders as unknown[])[0] as Record<string, unknown>;
			expect(Array.isArray(order.items)).toBe(true);
			const item = (order.items as unknown[])[0] as Record<string, unknown>;
			expect(item.sku).toBe('ABC-123');
		});

		test('should not mutate original array', () => {
			const original = [{ name: 'Alice' }, { name: 'Bob' }];
			const obj = { contacts: original };
			const result = PathResolver.set(obj, 'contacts[0].name', 'Jane');
			// Original should be unchanged
			expect(original[0].name).toBe('Alice');
			expect(
				((result.contacts as unknown[])[0] as Record<string, unknown>).name,
			).toBe('Jane');
		});

		test('should set primitive values in arrays', () => {
			const obj = { tags: ['a', 'b', 'c'] };
			const result = PathResolver.set(obj, 'tags[1]', 'updated');
			expect((result.tags as unknown[])[1]).toBe('updated');
			// Other items preserved
			expect((result.tags as unknown[])[0]).toBe('a');
			expect((result.tags as unknown[])[2]).toBe('c');
		});

		test('should handle setting beyond current array length', () => {
			const obj = { items: ['a'] };
			const result = PathResolver.set(obj, 'items[3]', 'far');
			const items = result.items as unknown[];
			expect(items[3]).toBe('far');
			expect(items[0]).toBe('a');
		});

		test('should handle mixed bracket and dot notation in set', () => {
			const obj = {
				user: {
					contacts: [{ address: { city: 'Boston' } }],
				},
			};
			const result = PathResolver.set(
				obj,
				'user.contacts[0].address.city',
				'NYC',
			);
			const contacts = (result.user as Record<string, unknown>)
				.contacts as unknown[];
			const address = (contacts[0] as Record<string, unknown>)
				.address as Record<string, unknown>;
			expect(address.city).toBe('NYC');
		});
	});

	describe('normalization', () => {
		test('bracket and dot-numeric should resolve the same value', () => {
			const obj = {
				items: [{ id: 1 }, { id: 2 }, { id: 3 }],
			};
			expect(PathResolver.get(obj, 'items[0].id')).toBe(
				PathResolver.get(obj, 'items.0.id'),
			);
			expect(PathResolver.get(obj, 'items[2].id')).toBe(
				PathResolver.get(obj, 'items.2.id'),
			);
		});

		test('multiple bracket notations in a single path', () => {
			const obj = {
				matrix: [
					[1, 2],
					[3, 4],
				],
			};
			expect(PathResolver.get(obj, 'matrix[0][1]')).toBe(2);
			expect(PathResolver.get(obj, 'matrix[1][0]')).toBe(3);
		});
	});
});
