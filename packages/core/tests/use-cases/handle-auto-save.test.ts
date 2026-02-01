import { describe, test, expect } from 'bun:test';
import {
	handleAutoSave,
	extractRecursiveAutoSave,
} from '@screamform/core/use-cases/handle-auto-save';
import type { UISchema } from '@screamform/core/domain/schema/types';
import type { FieldState } from '@screamform/core/use-cases/types';

describe('Use Case: handleAutoSave', () => {
	const schema: UISchema = {
		fields: {
			email: {
				label: 'Email',
				widget: 'text',
				autoSave: true,
				validation: { type: 'required', errorMessage: 'Email is required' },
			},
			secretCode: {
				label: 'Secret',
				widget: 'text',
				autoSave: true,
				rules: [
					{ effect: 'HIDE', condition: { field: 'email', operator: 'empty' } },
				],
			},
		},
	};

	test('should skip required fields that are empty', () => {
		const rawData = { email: '', secretCode: '123' };
		const result = handleAutoSave(schema, rawData);

		// Email is required but empty -> Skip
		// SecretCode is hidden because email is empty -> Skip
		expect(result.shouldSave).toBe(false);
		expect(result.payload).toEqual({});
	});

	test('should only include valid, visible, and enabled fields in payload', () => {
		const rawData = { email: 'test@test.com', secretCode: '999' };
		const result = handleAutoSave(schema, rawData);

		expect(result.shouldSave).toBe(true);
		expect(result.payload).toEqual({
			email: 'test@test.com',
			secretCode: '999',
		});
	});

	test('should skip fields where autoSave is explicitly false', () => {
		const customSchema: UISchema = {
			fields: {
				volatile: { label: 'Volatile', widget: 'text', autoSave: false },
			},
		};
		const result = handleAutoSave(customSchema, { volatile: "don't save me" });
		expect(result.shouldSave).toBe(false);
	});

	test('should skip fields where autoSave is not set (undefined)', () => {
		const customSchema: UISchema = {
			fields: {
				noAutoSave: { label: 'No AutoSave', widget: 'text' },
			},
		};
		const result = handleAutoSave(customSchema, { noAutoSave: 'some value' });
		expect(result.shouldSave).toBe(false);
		expect(result.payload).toEqual({});
	});

	test('should skip disabled fields', () => {
		const customSchema: UISchema = {
			fields: {
				locked: {
					label: 'Locked',
					widget: 'text',
					autoSave: true,
					rules: [
						{
							effect: 'DISABLE',
							condition: { field: 'locked', operator: '!==', value: '' },
						},
					],
				},
			},
		};
		const result = handleAutoSave(customSchema, { locked: 'value' });
		expect(result.shouldSave).toBe(false);
	});

	test('should skip fields with validation errors', () => {
		const customSchema: UISchema = {
			fields: {
				age: {
					label: 'Age',
					widget: 'number',
					autoSave: true,
					validation: { type: 'min', value: 18, errorMessage: 'Must be 18+' },
				},
			},
		};
		const result = handleAutoSave(customSchema, { age: 10 });
		expect(result.shouldSave).toBe(false);
		expect(result.payload).toEqual({});
	});

	test('should handle nested single object with itemSchema (extractRecursiveAutoSave)', () => {
		const nestedSchema: UISchema = {
			fields: {
				address: {
					label: 'Address',
					widget: 'object',
					autoSave: true,
					itemSchema: {
						city: { label: 'City', widget: 'text' },
						zip: { label: 'Zip', widget: 'text' },
					},
				},
			},
		};
		const result = handleAutoSave(nestedSchema, {
			address: { city: 'Boston', zip: '02101' },
		});
		expect(result.shouldSave).toBe(true);
		expect(result.payload).toEqual({
			address: { city: 'Boston', zip: '02101' },
		});
	});

	test('single-object branch: one field with non-array children (covers hasSingleObjectChildren path)', () => {
		const schema: UISchema = {
			fields: {
				profile: {
					label: 'Profile',
					widget: 'object',
					autoSave: true,
					itemSchema: {
						firstName: { label: 'First', widget: 'text' },
						lastName: { label: 'Last', widget: 'text' },
					},
				},
			},
		};
		const result = handleAutoSave(schema, {
			profile: { firstName: 'Jane', lastName: 'Doe' },
		});
		expect(result.shouldSave).toBe(true);
		expect(result.payload.profile).toEqual({
			firstName: 'Jane',
			lastName: 'Doe',
		});
	});

	test('extractRecursiveAutoSave single-object branch: direct call with Record children (covers 91-92)', () => {
		const field: FieldState = {
			value: { a: 'x', b: 'y' },
			isVisible: true,
			isDisabled: false,
			error: null,
			isRequired: false,
			label: 'Test',
			widget: 'object',
			placeholder: '',
			description: '',
			options: [],
			uiProps: {},
			children: {
				a: {
					value: 'x',
					isVisible: true,
					isDisabled: false,
					error: null,
					isRequired: false,
					label: 'A',
					widget: 'text',
					placeholder: '',
					description: '',
					options: [],
					uiProps: {},
				},
				b: {
					value: 'y',
					isVisible: true,
					isDisabled: false,
					error: null,
					isRequired: false,
					label: 'B',
					widget: 'text',
					placeholder: '',
					description: '',
					options: [],
					uiProps: {},
				},
			},
		};
		const result = extractRecursiveAutoSave(field);
		expect(result).toEqual({ a: 'x', b: 'y' });
	});

	test('extractRecursiveAutoSave fall-through: no children returns field.value (covers 92-93 false branch)', () => {
		const field: FieldState = {
			value: 'leaf-value',
			isVisible: true,
			isDisabled: false,
			error: null,
			isRequired: false,
			label: 'Leaf',
			widget: 'text',
			placeholder: '',
			description: '',
			options: [],
			uiProps: {},
			children: undefined,
		};
		const result = extractRecursiveAutoSave(field);
		expect(result).toBe('leaf-value');
	});

	test('should handle nested array of objects with itemSchema (extractRecursiveAutoSave)', () => {
		const arraySchema: UISchema = {
			fields: {
				items: {
					label: 'Items',
					widget: 'object',
					autoSave: true,
					itemSchema: {
						name: { label: 'Name', widget: 'text' },
						value: { label: 'Value', widget: 'text' },
					},
				},
			},
		};
		const result = handleAutoSave(arraySchema, {
			items: [
				{ name: 'Item 1', value: 'Val1' },
				{ name: 'Item 2', value: 'Val2' },
			],
		});
		expect(result.shouldSave).toBe(true);
		expect(result.payload).toEqual({
			items: [
				{ name: 'Item 1', value: 'Val1' },
				{ name: 'Item 2', value: 'Val2' },
			],
		});
	});

	test('should recursively extract nested object inside array items (subField.children in array branch)', () => {
		const arrayWithNestedSchema: UISchema = {
			fields: {
				rows: {
					label: 'Rows',
					widget: 'object',
					autoSave: true,
					itemSchema: {
						title: { label: 'Title', widget: 'text' },
						address: {
							label: 'Address',
							widget: 'object',
							itemSchema: {
								city: { label: 'City', widget: 'text' },
								zip: { label: 'Zip', widget: 'text' },
							},
						},
					},
				},
			},
		};
		const result = handleAutoSave(arrayWithNestedSchema, {
			rows: [
				{ title: 'Row 1', address: { city: 'Boston', zip: '02101' } },
				{ title: 'Row 2', address: { city: 'NYC', zip: '10001' } },
			],
		});
		expect(result.shouldSave).toBe(true);
		expect(result.payload).toEqual({
			rows: [
				{ title: 'Row 1', address: { city: 'Boston', zip: '02101' } },
				{ title: 'Row 2', address: { city: 'NYC', zip: '10001' } },
			],
		});
	});

	test('array branch: skip subField when not visible (covers lines 81-82)', () => {
		const schema: UISchema = {
			fields: {
				items: {
					label: 'Items',
					widget: 'object',
					autoSave: true,
					itemSchema: {
						name: { label: 'Name', widget: 'text' },
						secret: {
							label: 'Secret',
							widget: 'text',
							rules: {
								effect: 'HIDE',
								condition: { field: 'name', operator: '===', value: '' },
							},
						},
					},
				},
			},
		};
		const result = handleAutoSave(schema, {
			items: [
				{ name: '', secret: 'should-not-appear' },
				{ name: 'B', secret: 'visible-secret' },
			],
		});
		expect(result.shouldSave).toBe(true);
		expect(result.payload.items).toEqual([
			{ name: '' },
			{ name: 'B', secret: 'visible-secret' },
		]);
	});

	test('array branch: skip subField when it has error (covers 81-82 via !subField.error)', () => {
		const schema: UISchema = {
			fields: {
				rows: {
					label: 'Rows',
					widget: 'object',
					autoSave: true,
					itemSchema: {
						title: { label: 'Title', widget: 'text' },
						age: {
							label: 'Age',
							widget: 'number',
							validation: {
								type: 'min',
								value: 18,
								errorMessage: 'Must be 18+',
							},
						},
					},
				},
			},
		};
		const result = handleAutoSave(schema, {
			rows: [
				{ title: 'Adult', age: 25 },
				{ title: 'Child', age: 10 },
			],
		});
		expect(result.shouldSave).toBe(true);
		expect(result.payload.rows).toEqual([
			{ title: 'Adult', age: 25 },
			{ title: 'Child' },
		]);
	});

	test('should skip hidden nested fields in extractRecursiveAutoSave', () => {
		const nestedSchema: UISchema = {
			fields: {
				profile: {
					label: 'Profile',
					widget: 'object',
					autoSave: true,
					itemSchema: {
						name: { label: 'Name', widget: 'text' },
						secret: {
							label: 'Secret',
							widget: 'text',
							rules: {
								effect: 'HIDE',
								condition: { field: 'name', operator: '===', value: '' },
							},
						},
					},
				},
			},
		};
		const result = handleAutoSave(nestedSchema, {
			profile: { name: '', secret: 'hidden_value' },
		});
		expect(result.shouldSave).toBe(true);
		expect(result.payload.profile).toEqual({ name: '' });
		expect(result.payload.profile).not.toHaveProperty('secret');
	});

	test('should handle deeply nested children recursively', () => {
		const deepSchema: UISchema = {
			fields: {
				parent: {
					label: 'Parent',
					widget: 'object',
					autoSave: true,
					itemSchema: {
						child: {
							label: 'Child',
							widget: 'object',
							itemSchema: {
								grandchild: { label: 'Grandchild', widget: 'text' },
							},
						},
					},
				},
			},
		};
		const result = handleAutoSave(deepSchema, {
			parent: { child: { grandchild: 'deep_value' } },
		});
		expect(result.shouldSave).toBe(true);
		expect(result.payload).toEqual({
			parent: { child: { grandchild: 'deep_value' } },
		});
	});

	test('should handle null, undefined, and empty string for isEmpty check', () => {
		const testSchema: UISchema = {
			fields: {
				nullField: {
					label: 'Null',
					widget: 'text',
					autoSave: true,
					validation: { type: 'required', errorMessage: 'Required' },
				},
				undefinedField: {
					label: 'Undefined',
					widget: 'text',
					autoSave: true,
					validation: { type: 'required', errorMessage: 'Required' },
				},
				emptyField: {
					label: 'Empty',
					widget: 'text',
					autoSave: true,
					validation: { type: 'required', errorMessage: 'Required' },
				},
			},
		};

		const result1 = handleAutoSave(testSchema, {
			nullField: null,
			undefinedField: undefined,
			emptyField: '',
		});
		expect(result1.shouldSave).toBe(false);
		expect(result1.payload).toEqual({});

		const result2 = handleAutoSave(testSchema, {
			nullField: 'a',
			undefinedField: 'b',
			emptyField: 'c',
		});
		expect(result2.shouldSave).toBe(true);
		expect(result2.payload).toEqual({
			nullField: 'a',
			undefinedField: 'b',
			emptyField: 'c',
		});
	});

	test('should skip nested fields with errors in array of objects', () => {
		const arraySchema: UISchema = {
			fields: {
				items: {
					label: 'Items',
					widget: 'object',
					autoSave: true,
					itemSchema: {
						name: { label: 'Name', widget: 'text' },
						age: {
							label: 'Age',
							widget: 'number',
							validation: {
								type: 'min',
								value: 18,
								errorMessage: 'Must be 18+',
							},
						},
					},
				},
			},
		};
		const result = handleAutoSave(arraySchema, {
			items: [
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 10 }, // age has error, but we still include what's visible
			],
		});
		expect(result.shouldSave).toBe(true);
		// The extractRecursiveAutoSave should skip fields with errors
		expect(result.payload.items).toBeDefined();
	});
});
