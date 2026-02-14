import { describe, test, expect } from 'bun:test';
import { validateSection } from '@screamform/core/utils/validate-section';
import type { UISchema } from '@screamform/core/domain/schema/types';

describe('Utils: validateSection', () => {
	const schema: UISchema = {
		fields: {
			username: {
				label: 'Username',
				widget: 'text',
				validation: { type: 'required', errorMessage: 'Username is required' },
			},
			address: {
				label: 'Address',
				widget: 'section',
				itemSchema: {
					city: {
						label: 'City',
						widget: 'text',
						validation: { type: 'required', errorMessage: 'City is required' },
					},
					zip: {
						label: 'Zip',
						widget: 'text',
						validation: {
							operator: 'and',
							rules: [
								{ type: 'required', errorMessage: 'Zip is required' },
								{
									type: 'regex',
									value: '^\\d{5}$',
									errorMessage: 'Must be 5 digits',
								},
							],
						},
					},
					notes: {
						label: 'Notes',
						widget: 'text',
					},
				},
			},
			payment: {
				label: 'Payment',
				widget: 'section',
				itemSchema: {
					cardNumber: {
						label: 'Card Number',
						widget: 'text',
						validation: {
							type: 'required',
							errorMessage: 'Card number required',
						},
					},
				},
			},
		},
	};

	test('should return valid when section data is complete', () => {
		const result = validateSection(schema, 'address', {
			address: { city: 'NYC', zip: '10001', notes: '' },
		});
		expect(result.isValid).toBe(true);
		expect(result.errors).toEqual({});
	});

	test('should return errors when section data is incomplete', () => {
		const result = validateSection(schema, 'address', {
			address: { city: '', zip: '', notes: '' },
		});
		expect(result.isValid).toBe(false);
		expect(result.errors.city).toBe('City is required');
		expect(result.errors.zip).toBeDefined();
	});

	test('should validate only the specified section', () => {
		// Address is invalid but payment section is what we check
		const result = validateSection(schema, 'payment', {
			address: { city: '', zip: '' }, // invalid but not checked
			payment: { cardNumber: '4111111111111111' },
		});
		expect(result.isValid).toBe(true);
	});

	test('should return invalid for payment with missing card', () => {
		const result = validateSection(schema, 'payment', {
			payment: { cardNumber: '' },
		});
		expect(result.isValid).toBe(false);
		expect(result.errors.cardNumber).toBe('Card number required');
	});

	test('should handle missing section data gracefully', () => {
		const result = validateSection(schema, 'address', {});
		expect(result.isValid).toBe(false); // required fields are empty
		expect(result.errors.city).toBeDefined();
		expect(result.errors.zip).toBeDefined();
	});

	test('should handle non-existent section key', () => {
		const result = validateSection(schema, 'nonexistent', {});
		expect(result.isValid).toBe(true);
		expect(result.errors).toEqual({});
	});

	test('should handle field without itemSchema', () => {
		const result = validateSection(schema, 'username', {
			username: 'john',
		});
		expect(result.isValid).toBe(true);
		expect(result.errors).toEqual({});
	});

	test('should not report errors for optional fields', () => {
		const result = validateSection(schema, 'address', {
			address: { city: 'NYC', zip: '10001', notes: '' },
		});
		expect(result.errors.notes).toBeUndefined();
	});

	test('should validate regex rules', () => {
		const result = validateSection(schema, 'address', {
			address: { city: 'NYC', zip: 'ABCDE' },
		});
		expect(result.isValid).toBe(false);
		expect(result.errors.zip).toBe('Must be 5 digits');
	});

	test('should handle section data that is not an object', () => {
		const result = validateSection(schema, 'address', {
			address: 'not an object',
		});
		expect(result.isValid).toBe(false); // required fields treated as missing
	});

	test('should handle null section data', () => {
		const result = validateSection(schema, 'address', {
			address: null,
		});
		expect(result.isValid).toBe(false);
	});
});
