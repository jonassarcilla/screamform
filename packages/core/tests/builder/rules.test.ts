import { describe, test, expect } from 'bun:test';
import {
	tupleToCondition,
	tuplesToLogicGroup,
	tupleToRule,
	tuplesToRule,
} from '@screamform/core/builder/rules';

describe('Builder: Rules Helpers', () => {
	describe('tupleToCondition', () => {
		test('should create a condition from a tuple with value', () => {
			const result = tupleToCondition(['role', '===', 'admin']);
			expect(result).toEqual({
				field: 'role',
				operator: '===',
				value: 'admin',
			});
		});

		test('should create a condition from a tuple without value', () => {
			const result = tupleToCondition(['name', 'empty']);
			expect(result).toEqual({
				field: 'name',
				operator: 'empty',
			});
		});

		test('should handle array value', () => {
			const result = tupleToCondition(['status', 'in', ['active', 'pending']]);
			expect(result).toEqual({
				field: 'status',
				operator: 'in',
				value: ['active', 'pending'],
			});
		});

		test('should handle numeric value', () => {
			const result = tupleToCondition(['age', '>=', 18]);
			expect(result).toEqual({
				field: 'age',
				operator: '>=',
				value: 18,
			});
		});

		test('should handle boolean value', () => {
			const result = tupleToCondition(['active', '===', true]);
			expect(result).toEqual({
				field: 'active',
				operator: '===',
				value: true,
			});
		});

		test('should omit value property when value is undefined', () => {
			const result = tupleToCondition(['field', 'empty', undefined]);
			expect(result).toEqual({
				field: 'field',
				operator: 'empty',
			});
			expect('value' in result).toBe(false);
		});
	});

	describe('tuplesToLogicGroup', () => {
		test('should create AND logic group', () => {
			const result = tuplesToLogicGroup(
				[
					['role', '===', 'admin'],
					['age', '>=', 18],
				],
				'and',
			);
			expect(result.operator).toBe('and');
			expect(result.conditions).toHaveLength(2);
			expect(result.conditions[0]).toEqual({
				field: 'role',
				operator: '===',
				value: 'admin',
			});
			expect(result.conditions[1]).toEqual({
				field: 'age',
				operator: '>=',
				value: 18,
			});
		});

		test('should create OR logic group', () => {
			const result = tuplesToLogicGroup(
				[
					['role', '===', 'admin'],
					['role', '===', 'editor'],
				],
				'or',
			);
			expect(result.operator).toBe('or');
			expect(result.conditions).toHaveLength(2);
		});

		test('should handle single tuple', () => {
			const result = tuplesToLogicGroup([['name', 'empty']], 'and');
			expect(result.conditions).toHaveLength(1);
		});
	});

	describe('tupleToRule', () => {
		test('should create a SHOW rule', () => {
			const result = tupleToRule('SHOW', ['role', '===', 'admin']);
			expect(result.effect).toBe('SHOW');
			expect(result.condition).toEqual({
				field: 'role',
				operator: '===',
				value: 'admin',
			});
		});

		test('should create a DISABLE rule', () => {
			const result = tupleToRule('DISABLE', ['locked', '===', true]);
			expect(result.effect).toBe('DISABLE');
		});

		test('should create rules for all effects', () => {
			const effects = [
				'SHOW',
				'HIDE',
				'DISABLE',
				'ENABLE',
				'REQUIRE',
				'OPTIONAL',
			] as const;
			for (const effect of effects) {
				const result = tupleToRule(effect, ['field', '===', 'val']);
				expect(result.effect).toBe(effect);
			}
		});
	});

	describe('tuplesToRule', () => {
		test('should create a SHOW rule with AND conditions', () => {
			const result = tuplesToRule(
				'SHOW',
				[
					['role', '===', 'admin'],
					['active', '===', true],
				],
				'and',
			);
			expect(result.effect).toBe('SHOW');
			expect('operator' in result.condition).toBe(true);
			const group = result.condition as {
				operator: string;
				conditions: unknown[];
			};
			expect(group.operator).toBe('and');
			expect(group.conditions).toHaveLength(2);
		});

		test('should create a HIDE rule with OR conditions', () => {
			const result = tuplesToRule(
				'HIDE',
				[
					['status', '===', 'archived'],
					['status', '===', 'deleted'],
				],
				'or',
			);
			expect(result.effect).toBe('HIDE');
			const group = result.condition as {
				operator: string;
				conditions: unknown[];
			};
			expect(group.operator).toBe('or');
		});
	});
});
