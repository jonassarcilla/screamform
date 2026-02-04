import { processSubmission, type UISchema } from '@screamform/core';
import { describe, test, expect } from 'bun:test';

describe('Use Case: processSubmission', () => {
	test('failure path: returns success false, data null, and errors when validation fails', () => {
		const schema: UISchema = {
			fields: {
				name: {
					label: 'Name',
					widget: 'text',
					validation: { type: 'required', errorMessage: 'Name is required' },
				},
				age: {
					label: 'Age',
					widget: 'number-input',
					validation: { type: 'min', value: 18, errorMessage: 'Must be 18+' },
				},
			},
		};
		const result = processSubmission(schema, { name: '', age: 10 });

		expect(result.success).toBe(false);
		expect(result.data).toBe(null);
		expect(result.errors).not.toBe(null);
		expect(result.errors?.name).toBe('Name is required');
		expect(result.errors?.age).toBe('Must be 18+');
	});

	test('processSubmission: should recursively strip hidden nested data', () => {
		const schema: UISchema = {
			fields: {
				hasAddress: { label: 'Add Address?', widget: 'checkbox' },
				address: {
					label: 'Address',
					widget: 'object',
					rules: {
						effect: 'SHOW',
						condition: { field: 'hasAddress', operator: '===', value: true },
					},
					itemSchema: {
						city: { label: 'City', widget: 'text' },
					},
				},
			},
		};

		const dirtyData = {
			hasAddress: false,
			address: { city: 'New York' },
		};

		const result = processSubmission(schema, dirtyData);

		expect(result.success).toBe(true);
		expect(result.data).not.toHaveProperty('address'); // Child data is purged because parent is hidden
		expect(result.data).toEqual({ hasAddress: false });
	});

	test('success path: respects schema.exclude and returns clean data', () => {
		const schema: UISchema = {
			exclude: ['internalId'],
			fields: {
				name: { label: 'Name', widget: 'text' },
				internalId: { label: 'Internal', widget: 'text' },
			},
		};
		const result = processSubmission(schema, {
			name: 'Jane',
			internalId: 'secret-123',
		});
		expect(result.success).toBe(true);
		expect(result.data).not.toBe(null);
		expect(result.data).toHaveProperty('name', 'Jane');
		expect(result.data).not.toHaveProperty('internalId');
		expect(result.errors).toBe(null);
	});

	test('success path: extractCleanData includes visible single nested object (itemSchema)', () => {
		const schema: UISchema = {
			fields: {
				name: { label: 'Name', widget: 'text' },
				address: {
					label: 'Address',
					widget: 'object',
					itemSchema: {
						city: { label: 'City', widget: 'text' },
						zip: { label: 'Zip', widget: 'text' },
					},
				},
			},
		};
		const result = processSubmission(schema, {
			name: 'Jane',
			address: { city: 'Boston', zip: '02101' },
		});
		expect(result.success).toBe(true);
		expect(result.data).not.toBe(null);
		expect(result.data).toEqual({
			name: 'Jane',
			address: { city: 'Boston', zip: '02101' },
		});
		expect(result.errors).toBe(null);
	});

	test('success path: extractCleanData includes visible array of nested objects (itemSchema)', () => {
		const schema: UISchema = {
			fields: {
				items: {
					label: 'Items',
					widget: 'object',
					itemSchema: {
						title: { label: 'Title', widget: 'text' },
					},
				},
			},
		};
		const result = processSubmission(schema, {
			items: [{ title: 'First' }, { title: 'Second' }],
		});
		expect(result.success).toBe(true);
		expect(result.data).not.toBe(null);
		expect(result.data).toEqual({
			items: [{ title: 'First' }, { title: 'Second' }],
		});
		expect(result.errors).toBe(null);
	});

	test('success path: leaf with null input gets widget fallback (text → empty string)', () => {
		const schema: UISchema = {
			fields: {
				opt: { label: 'Optional', widget: 'text' },
			},
		};
		const result = processSubmission(schema, { opt: null });
		expect(result.success).toBe(true);
		expect(result.data).not.toBe(null);
		expect(result.data).toHaveProperty('opt');
		// getFieldState replaces null with getFallbackValue('text') = '', so payload has '' not null
		expect(result.data?.opt).toBe('');
	});

	test('success path: array value (e.g. multi-select) passes through unchanged', () => {
		const schema: UISchema = {
			fields: {
				tags: { label: 'Tags', widget: 'multi-select' },
			},
		};
		const result = processSubmission(schema, { tags: ['a', 'b'] });
		expect(result.success).toBe(true);
		expect(result.data).not.toBe(null);
		expect(result.data?.tags).toEqual(['a', 'b']);
	});

	test('success path: configData null passes through in payload', () => {
		const schema: UISchema = {
			fields: {
				opt: { label: 'Optional', widget: 'text' },
			},
		};
		const result = processSubmission(schema, { opt: null }, { opt: null });
		expect(result.success).toBe(true);
		expect(result.data).toHaveProperty('opt');
		expect(result.data?.opt).toBe(null);
	});
});
