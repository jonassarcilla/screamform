import { describe, test, expect } from 'bun:test';
import { getPIIFields } from '@screamform/core/utils/get-pii-fields';
import type { UISchema } from '@screamform/core/domain/schema/types';

describe('Utils: getPIIFields', () => {
	test('should return empty array for schema with no sensitive fields', () => {
		const schema: UISchema = {
			fields: {
				name: { label: 'Name', widget: 'text' },
				age: { label: 'Age', widget: 'number' },
			},
		};
		expect(getPIIFields(schema)).toEqual([]);
	});

	test('should find PII fields', () => {
		const schema: UISchema = {
			fields: {
				name: { label: 'Name', widget: 'text', sensitivity: 'public' },
				ssn: { label: 'SSN', widget: 'text', sensitivity: 'pii' },
				email: { label: 'Email', widget: 'text', sensitivity: 'pii' },
			},
		};
		expect(getPIIFields(schema)).toEqual(['ssn', 'email']);
	});

	test('should find confidential fields', () => {
		const schema: UISchema = {
			fields: {
				secret: {
					label: 'Secret',
					widget: 'text',
					sensitivity: 'confidential',
				},
				public: { label: 'Public', widget: 'text', sensitivity: 'public' },
			},
		};
		expect(getPIIFields(schema)).toEqual(['secret']);
	});

	test('should not include internal or public fields', () => {
		const schema: UISchema = {
			fields: {
				name: { label: 'Name', widget: 'text', sensitivity: 'public' },
				role: { label: 'Role', widget: 'text', sensitivity: 'internal' },
			},
		};
		expect(getPIIFields(schema)).toEqual([]);
	});

	test('should find PII fields in nested sections', () => {
		const schema: UISchema = {
			fields: {
				name: { label: 'Name', widget: 'text', sensitivity: 'public' },
				address: {
					label: 'Address',
					widget: 'section',
					sensitivity: 'pii',
					itemSchema: {
						street: { label: 'Street', widget: 'text', sensitivity: 'pii' },
						city: { label: 'City', widget: 'text' },
					},
				},
			},
		};
		const result = getPIIFields(schema);
		expect(result).toContain('address');
		expect(result).toContain('address.street');
		expect(result).not.toContain('name');
		expect(result).not.toContain('address.city');
	});

	test('should support custom classifications', () => {
		const schema: UISchema = {
			fields: {
				name: { label: 'Name', widget: 'text', sensitivity: 'internal' },
				secret: {
					label: 'Secret',
					widget: 'text',
					sensitivity: 'confidential',
				},
			},
		};
		const result = getPIIFields(schema, ['internal']);
		expect(result).toEqual(['name']);
	});

	test('should handle deeply nested sections', () => {
		const schema: UISchema = {
			fields: {
				contact: {
					label: 'Contact',
					widget: 'section',
					itemSchema: {
						personal: {
							label: 'Personal',
							widget: 'section',
							itemSchema: {
								ssn: { label: 'SSN', widget: 'text', sensitivity: 'pii' },
							},
						},
					},
				},
			},
		};
		expect(getPIIFields(schema)).toEqual(['contact.personal.ssn']);
	});

	test('should handle empty fields', () => {
		const schema: UISchema = { fields: {} };
		expect(getPIIFields(schema)).toEqual([]);
	});

	test('should handle fields without sensitivity', () => {
		const schema: UISchema = {
			fields: {
				name: { label: 'Name', widget: 'text' },
			},
		};
		expect(getPIIFields(schema)).toEqual([]);
	});
});
