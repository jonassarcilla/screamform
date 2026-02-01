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

		test('should handle array values', () => {
			const obj = { user: [1, 2, 3] };
			const result = PathResolver.set(obj, 'user.length', 5);
			expect(result.user).toBeDefined();
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
	});
});
