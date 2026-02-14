import { describe, test, expect } from 'bun:test';
import { validateSchema } from '@screamform/core/utils/validate-schema';
import type { UISchema } from '@screamform/core/domain/schema/types';

describe('Utils: validateSchema', () => {
	test('should return empty array for valid schema', () => {
		const schema: UISchema = {
			fields: {
				name: { label: 'Name', widget: 'text' },
				age: { label: 'Age', widget: 'number' },
			},
		};
		expect(validateSchema(schema)).toEqual([]);
	});

	test('should warn about missing label', () => {
		const schema: UISchema = {
			fields: {
				name: { label: '', widget: 'text' },
			},
		};
		const issues = validateSchema(schema);
		expect(
			issues.some(
				(i) => i.path === 'name' && i.message.includes('missing a label'),
			),
		).toBe(true);
	});

	test('should warn about whitespace-only label', () => {
		const schema: UISchema = {
			fields: {
				name: { label: '   ', widget: 'text' },
			},
		};
		const issues = validateSchema(schema);
		expect(issues.some((i) => i.message.includes('missing a label'))).toBe(
			true,
		);
	});

	test('should warn about select without options', () => {
		const schema: UISchema = {
			fields: {
				role: {
					label: 'Role',
					widget: 'select',
					options: [],
				},
			},
		};
		const issues = validateSchema(schema);
		expect(issues.some((i) => i.message.includes('no options'))).toBe(true);
	});

	test('should not warn about select with optionsKey', () => {
		const schema: UISchema = {
			fields: {
				role: {
					label: 'Role',
					widget: 'select',
					options: [],
					uiProps: { optionsKey: 'availableRoles' },
				},
			},
		};
		const issues = validateSchema(schema);
		expect(issues.some((i) => i.message.includes('no options'))).toBe(false);
	});

	test('should not warn about select with options', () => {
		const schema: UISchema = {
			fields: {
				role: {
					label: 'Role',
					widget: 'select',
					options: [{ label: 'Admin', value: 'admin' }],
				},
			},
		};
		const issues = validateSchema(schema);
		expect(issues.some((i) => i.message.includes('no options'))).toBe(false);
	});

	test('should error on min > max', () => {
		const schema: UISchema = {
			fields: {
				score: {
					label: 'Score',
					widget: 'number',
					validation: {
						operator: 'and',
						rules: [
							{ type: 'min', value: 100, errorMessage: 'Too low' },
							{ type: 'max', value: 10, errorMessage: 'Too high' },
						],
					},
				},
			},
		};
		const issues = validateSchema(schema);
		expect(
			issues.some((i) => i.severity === 'error' && i.message.includes('min')),
		).toBe(true);
	});

	test('should not error when min < max', () => {
		const schema: UISchema = {
			fields: {
				score: {
					label: 'Score',
					widget: 'number',
					validation: {
						operator: 'and',
						rules: [
							{ type: 'min', value: 1, errorMessage: 'Too low' },
							{ type: 'max', value: 100, errorMessage: 'Too high' },
						],
					},
				},
			},
		};
		const issues = validateSchema(schema);
		expect(issues.some((i) => i.message.includes('min'))).toBe(false);
	});

	test('should warn about unknown widget', () => {
		const schema: UISchema = {
			fields: {
				rating: { label: 'Rating', widget: 'star-rating' },
			},
		};
		const issues = validateSchema(schema);
		expect(issues.some((i) => i.message.includes('Unknown widget'))).toBe(true);
	});

	test('should not warn about known widgets', () => {
		const knownWidgets = [
			'text',
			'number',
			'select',
			'multi-select',
			'checkbox',
			'switch',
			'slider',
			'date',
			'date-picker',
			'section',
			'array',
		];
		for (const widget of knownWidgets) {
			const schema: UISchema = {
				fields: { f: { label: 'Field', widget } },
			};
			const issues = validateSchema(schema);
			expect(issues.some((i) => i.message.includes('Unknown widget'))).toBe(
				false,
			);
		}
	});

	test('should error on empty itemSchema', () => {
		const schema: UISchema = {
			fields: {
				section: {
					label: 'Section',
					widget: 'section',
					itemSchema: {},
				},
			},
		};
		const issues = validateSchema(schema);
		expect(
			issues.some(
				(i) => i.severity === 'error' && i.message.includes('empty itemSchema'),
			),
		).toBe(true);
	});

	test('should validate nested fields in itemSchema', () => {
		const schema: UISchema = {
			fields: {
				address: {
					label: 'Address',
					widget: 'section',
					itemSchema: {
						city: { label: '', widget: 'text' }, // missing label
					},
				},
			},
		};
		const issues = validateSchema(schema);
		expect(issues.some((i) => i.path === 'address.city')).toBe(true);
	});

	test('should handle schema with no fields', () => {
		const schema: UISchema = { fields: {} };
		expect(validateSchema(schema)).toEqual([]);
	});

	test('should handle validation without min/max', () => {
		const schema: UISchema = {
			fields: {
				name: {
					label: 'Name',
					widget: 'text',
					validation: { type: 'required', errorMessage: 'Required' },
				},
			},
		};
		expect(validateSchema(schema).some((i) => i.message.includes('min'))).toBe(
			false,
		);
	});

	test('should handle select without options property at all', () => {
		const schema: UISchema = {
			fields: {
				role: {
					label: 'Role',
					widget: 'select',
				},
			},
		};
		const issues = validateSchema(schema);
		expect(issues.some((i) => i.message.includes('no options'))).toBe(true);
	});

	test('should handle multi-select without options', () => {
		const schema: UISchema = {
			fields: {
				tags: {
					label: 'Tags',
					widget: 'multi-select',
				},
			},
		};
		const issues = validateSchema(schema);
		expect(issues.some((i) => i.message.includes('no options'))).toBe(true);
	});
});
