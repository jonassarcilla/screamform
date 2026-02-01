import { DEFAULT_VALIDATION_MESSAGES } from '@screamform/core/domain/constants/validation-messages';
import type {
	ValidationRule,
	ValidationGroup,
	UISchema,
} from '@screamform/core/domain/schema/types';
import {
	evaluateValidation,
	validateFormData,
} from '@screamform/core/domain/schema/validator';
import { describe, test, expect } from 'bun:test';

describe('Domain: Validator Engine', () => {
	describe('Base Operators (Leaves)', () => {
		test('required: should detect empty values', () => {
			const rule: ValidationRule = {
				type: 'required',
				errorMessage: 'Field is mandatory',
			};
			expect(evaluateValidation(rule, 'hello')).toBeNull();
			expect(evaluateValidation(rule, '')).toBe('Field is mandatory');
			expect(evaluateValidation(rule, null)).toBe('Field is mandatory');
		});

		test('regex: should validate email formats', () => {
			const rule: ValidationRule = {
				type: 'regex',
				value: '^\\S+@\\S+\\.\\S+$',
				errorMessage: 'Bad Email',
			};
			expect(evaluateValidation(rule, 'test@acme.com')).toBeNull();
			expect(evaluateValidation(rule, 'invalid-email')).toBe('Bad Email');
			expect(evaluateValidation(rule, 123)).toBe('Bad Email');
		});

		test('in: should validate against allowed set', () => {
			const rule: ValidationRule = {
				type: 'in',
				value: ['USD', 'EUR'],
				errorMessage: 'Unsupported Currency',
			};
			expect(evaluateValidation(rule, 'USD')).toBeNull();
			expect(evaluateValidation(rule, 'PHP')).toBe('Unsupported Currency');
		});

		test('in: should fail when rule.value is not an array', () => {
			const rule = {
				type: 'in',
				value: 'USD',
				errorMessage: 'Not in list',
			} as ValidationRule;
			expect(evaluateValidation(rule, 'USD')).toBe('Not in list');
		});

		test('startsWith: should validate string prefix', () => {
			const rule: ValidationRule = {
				type: 'startsWith',
				value: 'DOC_',
				errorMessage: 'Must start with DOC_',
			};
			expect(evaluateValidation(rule, 'DOC_final.pdf')).toBeNull();
			expect(evaluateValidation(rule, 'final.pdf')).toBe(
				'Must start with DOC_',
			);
			expect(evaluateValidation(rule, 42)).toBe('Must start with DOC_');
		});

		test('endsWith: should validate string suffix', () => {
			const rule: ValidationRule = {
				type: 'endsWith',
				value: '.pdf',
				errorMessage: 'Must end with .pdf',
			};
			expect(evaluateValidation(rule, 'report.pdf')).toBeNull();
			expect(evaluateValidation(rule, 'report.txt')).toBe('Must end with .pdf');
			expect(evaluateValidation(rule, null)).toBe('Must end with .pdf');
		});

		test('min/max: should validate numeric bounds', () => {
			const minRule: ValidationRule = {
				type: 'min',
				value: 10,
				errorMessage: 'Too low',
			};
			expect(evaluateValidation(minRule, 15)).toBeNull();
			expect(evaluateValidation(minRule, 5)).toBe('Too low');
			expect(evaluateValidation(minRule, '15')).toBe('Too low');
			const maxRule: ValidationRule = {
				type: 'max',
				value: 100,
				errorMessage: 'Too high',
			};
			expect(evaluateValidation(maxRule, 50)).toBeNull();
			expect(evaluateValidation(maxRule, 150)).toBe('Too high');
			expect(evaluateValidation(maxRule, '50')).toBe('Too high');
		});

		test('contains: should validate array or string contains value', () => {
			const rule: ValidationRule = {
				type: 'contains',
				value: 'ok',
				errorMessage: 'Must contain ok',
			};
			expect(evaluateValidation(rule, ['a', 'ok', 'b'])).toBeNull();
			expect(evaluateValidation(rule, ['a', 'b'])).toBe('Must contain ok');
			expect(evaluateValidation(rule, 'poker')).toBeNull();
			expect(evaluateValidation(rule, 'nope')).toBe('Must contain ok');
			expect(evaluateValidation(rule, 42)).toBe('Must contain ok');
		});
	});

	describe('Recursive Logic (Groups)', () => {
		test('AND: should fail if any inner rule fails', () => {
			const group: ValidationGroup = {
				operator: 'and',
				rules: [
					{ type: 'required', errorMessage: 'Required' },
					{ type: 'min', value: 10, errorMessage: 'Too low' },
				],
			};
			// Passes both
			expect(evaluateValidation(group, 15)).toBeNull();
			// Fails second rule
			expect(evaluateValidation(group, 5)).toBe('Too low');
		});

		test('OR: should pass if at least one rule passes', () => {
			const group: ValidationGroup = {
				operator: 'or',
				rules: [
					{ type: 'startsWith', value: 'A', errorMessage: 'Starts with A' },
					{ type: 'startsWith', value: 'B', errorMessage: 'Starts with B' },
				],
			};
			expect(evaluateValidation(group, 'Apple')).toBeNull();
			expect(evaluateValidation(group, 'Banana')).toBeNull();
			// Returns the error message of the first failed rule when all fail
			expect(evaluateValidation(group, 'Cherry')).toBe('Starts with A');
		});

		test('OR: should return fallback when all rules fail and firstResult exists', () => {
			const group: ValidationGroup = {
				operator: 'or',
				rules: [
					{ type: 'required', errorMessage: 'Required' },
					{ type: 'required', errorMessage: 'Also required' },
				],
			};
			expect(evaluateValidation(group, '')).toBe('Required');
		});

		test("OR: should return 'None of the required conditions were met' when group has no rules", () => {
			const group: ValidationGroup = { operator: 'or', rules: [] };
			expect(evaluateValidation(group, 'anything')).toBe(
				'None of the required conditions were met',
			);
		});

		test('NOT: should negate the result', () => {
			const group: ValidationGroup = {
				operator: 'not',
				rules: [
					{
						type: 'contains',
						value: 'admin',
						errorMessage: 'No admins allowed',
					},
				],
			};
			// "user" does NOT contain "admin" -> inner check fails -> NOT makes it pass (null)
			expect(evaluateValidation(group, 'user-123')).toBeNull();
			// "admin-123" DOES contain "admin" -> inner check passes -> NOT makes it fail
			expect(evaluateValidation(group, 'admin-123')).toBe(
				'This value is specifically disallowed',
			);
		});

		test('default: unknown logic group operator returns null', () => {
			const group = {
				operator: 'xor',
				rules: [{ type: 'required', errorMessage: 'Required' }],
			} as unknown as ValidationGroup;
			expect(evaluateValidation(group, '')).toBe(null);
		});
	});

	describe('Fallback Logic', () => {
		test('should use DEFAULT_VALIDATION_MESSAGES if errorMessage is missing', () => {
			const rule = { type: 'required' } as ValidationRule; // No errorMessage
			expect(evaluateValidation(rule, '')).toBe(
				DEFAULT_VALIDATION_MESSAGES.required,
			);
		});
	});

	describe('validateFormData', () => {
		test('should return success and no errors when all validations pass', () => {
			const schema: UISchema = {
				fields: {
					name: {
						label: 'Name',
						widget: 'text',
						validation: { type: 'required', errorMessage: 'Required' },
					},
					age: {
						label: 'Age',
						widget: 'number',
						validation: { type: 'min', value: 18, errorMessage: 'Must be 18+' },
					},
				},
			};
			const result = validateFormData(schema, { name: 'Jane', age: 25 });
			expect(result.success).toBe(true);
			expect(result.errors).toEqual({});
		});

		test('should return errors for fields that fail validation', () => {
			const schema: UISchema = {
				fields: {
					name: {
						label: 'Name',
						widget: 'text',
						validation: { type: 'required', errorMessage: 'Name is required' },
					},
					age: {
						label: 'Age',
						widget: 'number',
						validation: { type: 'min', value: 18, errorMessage: 'Must be 18+' },
					},
				},
			};
			const result = validateFormData(schema, { name: '', age: 10 });
			expect(result.success).toBe(false);
			expect(result.errors.name).toBe('Name is required');
			expect(result.errors.age).toBe('Must be 18+');
		});

		test('should skip fields without validation', () => {
			const schema: UISchema = {
				fields: {
					name: {
						label: 'Name',
						widget: 'text',
						validation: { type: 'required', errorMessage: 'Required' },
					},
					note: { label: 'Note', widget: 'text' },
				},
			};
			const result = validateFormData(schema, { name: 'x', note: 'anything' });
			expect(result.success).toBe(true);
			expect(result.errors).toEqual({});
		});
	});
});
