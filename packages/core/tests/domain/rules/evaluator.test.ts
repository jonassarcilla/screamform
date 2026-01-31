import { evaluateLogic } from '@screamform/core/domain/rules/evaluator';
import { describe, test, expect } from 'bun:test';
import { expectTypeOf } from 'expect-type';

describe('Domain: Evaluator Logic', () => {
	test('type check: should accept Record<string, unknown> and avoid any', () => {
		// This proves the function signature is safe
		expectTypeOf(evaluateLogic).parameters.toExtend<
			[logic: any, data: Record<string, unknown>] // logic is 'any' here only because of the recursive union complexity
		>();

		expectTypeOf(evaluateLogic).returns.toBeBoolean();
	});

	test("should treat 'false' as a non-empty value (Processing Integrity)", () => {
		const data = { hasAcceptedTerms: false };
		const condition = { field: 'hasAcceptedTerms', operator: 'empty' } as const;

		// In plain JS, !false is true. In our engine, false is a value, so it's NOT empty.
		expect(evaluateLogic(condition, data)).toBe(false);
	});

	test("should treat 'null' or 'undefined' as empty", () => {
		expect(evaluateLogic({ field: 'missing', operator: 'empty' }, {})).toBe(
			true,
		);
		expect(
			evaluateLogic({ field: 'none', operator: 'empty' }, { none: null }),
		).toBe(true);
	});

	test('should avoid type coercion for numeric comparisons', () => {
		// String "20" should not be greater than number 10 in a strict system
		const data = { age: '20' };
		const condition = { field: 'age', operator: '>', value: 10 } as any;

		expect(evaluateLogic(condition, data)).toBe(false);
	});

	describe('Runtime: Logic Processing', () => {
		const data = {
			age: 25,
			role: 'admin',
			tags: ['internal'],
		};

		test('should evaluate equality without type coercion', () => {
			expect(
				evaluateLogic({ field: 'age', operator: '===', value: 25 }, data),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'age', operator: '===', value: '25' as any },
					data,
				),
			).toBe(false);
		});

		test('should evaluate boolean equality (covers isBoolean)', () => {
			const dataWithBool = { ...data, active: true, enabled: false };
			expect(
				evaluateLogic(
					{ field: 'active', operator: '===', value: true },
					dataWithBool,
				),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'enabled', operator: '===', value: false },
					dataWithBool,
				),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'active', operator: '===', value: false },
					dataWithBool,
				),
			).toBe(false);
		});

		test('should evaluate inequality (!==)', () => {
			expect(
				evaluateLogic({ field: 'role', operator: '!==', value: 'guest' }, data),
			).toBe(true);
			expect(
				evaluateLogic({ field: 'role', operator: '!==', value: 'admin' }, data),
			).toBe(false);
		});

		test('should handle numeric >, <, >=, <=', () => {
			expect(
				evaluateLogic({ field: 'age', operator: '>', value: 20 }, data),
			).toBe(true);
			expect(
				evaluateLogic({ field: 'age', operator: '>', value: 30 }, data),
			).toBe(false);
			expect(
				evaluateLogic({ field: 'age', operator: '<', value: 30 }, data),
			).toBe(true);
			expect(
				evaluateLogic({ field: 'age', operator: '<', value: 10 }, data),
			).toBe(false);
			expect(
				evaluateLogic({ field: 'age', operator: '>=', value: 25 }, data),
			).toBe(true);
			expect(
				evaluateLogic({ field: 'age', operator: '>=', value: 26 }, data),
			).toBe(false);
			expect(
				evaluateLogic({ field: 'age', operator: '<=', value: 25 }, data),
			).toBe(true);
			expect(
				evaluateLogic({ field: 'age', operator: '<=', value: 24 }, data),
			).toBe(false);
		});

		test('should return false for numeric ops when value is not a number', () => {
			expect(
				evaluateLogic(
					{ field: 'age', operator: '>', value: '20' as any },
					data,
				),
			).toBe(false);
			expect(
				evaluateLogic(
					{ field: 'role', operator: '<', value: 1 },
					{ role: 'admin' },
				),
			).toBe(false);
		});

		test('should handle startsWith and endsWith', () => {
			expect(
				evaluateLogic(
					{ field: 'role', operator: 'startsWith', value: 'ad' },
					data,
				),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'role', operator: 'startsWith', value: 'x' },
					data,
				),
			).toBe(false);
			expect(
				evaluateLogic(
					{ field: 'role', operator: 'endsWith', value: 'in' },
					data,
				),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'role', operator: 'endsWith', value: 'x' },
					data,
				),
			).toBe(false);
		});

		test("should handle the 'empty' operator", () => {
			expect(
				evaluateLogic(
					{ field: 'missing', operator: 'empty', value: undefined },
					{ missing: null },
				),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'missing', operator: 'empty', value: undefined },
					{ missing: undefined },
				),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'name', operator: 'empty', value: undefined },
					{ name: '' },
				),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'list', operator: 'empty', value: undefined },
					{ list: [] },
				),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'role', operator: 'empty', value: undefined },
					data,
				),
			).toBe(false);
			expect(
				evaluateLogic(
					{ field: 'tags', operator: 'empty', value: undefined },
					data,
				),
			).toBe(false);
		});

		test('should return false for unknown condition operator (default branch)', () => {
			const condition = { field: 'age', operator: 'unknown' as any, value: 25 };
			expect(evaluateLogic(condition, data)).toBe(false);
		});

		test("should handle the 'in' operator for sets", () => {
			const condition = {
				field: 'role',
				operator: 'in',
				value: ['admin', 'editor'],
			};
			expect(evaluateLogic(condition as any, data)).toBe(true);
		});

		test('should handle complex recursion (or + and)', () => {
			const complex = {
				operator: 'or',
				conditions: [
					{ field: 'role', operator: '===', value: 'super-admin' },
					{
						operator: 'and',
						conditions: [
							{ field: 'age', operator: '>', value: 20 },
							{ field: 'tags', operator: 'contains', value: 'internal' },
						],
					},
				],
			};
			expect(evaluateLogic(complex as any, data)).toBe(true);
		});

		test("should handle 'and' returning false when one condition fails", () => {
			const andGroup = {
				operator: 'and',
				conditions: [
					{ field: 'age', operator: '===', value: 25 },
					{ field: 'role', operator: '===', value: 'guest' },
				],
			};
			expect(evaluateLogic(andGroup as any, data)).toBe(false);
		});

		test("should handle 'or' returning false when all conditions fail", () => {
			const orGroup = {
				operator: 'or',
				conditions: [
					{ field: 'role', operator: '===', value: 'guest' },
					{ field: 'age', operator: '===', value: 99 },
				],
			};
			expect(evaluateLogic(orGroup as any, data)).toBe(false);
		});

		test("should handle 'not' operator", () => {
			const notFalse = {
				operator: 'not',
				conditions: [{ field: 'age', operator: '===', value: 99 }],
			};
			expect(evaluateLogic(notFalse as any, data)).toBe(true);
			const notTrue = {
				operator: 'not',
				conditions: [{ field: 'age', operator: '===', value: 25 }],
			};
			expect(evaluateLogic(notTrue as any, data)).toBe(false);
		});

		test('should return true for unknown logic group operator (default branch)', () => {
			const unknownGroup = {
				operator: 'xor',
				conditions: [{ field: 'age', operator: '===', value: 25 }],
			} as any;
			expect(evaluateLogic(unknownGroup, data)).toBe(true);
		});

		test("should handle 'contains' for arrays", () => {
			expect(
				evaluateLogic(
					{ field: 'tags', operator: 'contains', value: 'internal' },
					data,
				),
			).toBe(true);
			expect(
				evaluateLogic(
					{ field: 'tags', operator: 'contains', value: 'missing' },
					data,
				),
			).toBe(false);
		});
	});
});
