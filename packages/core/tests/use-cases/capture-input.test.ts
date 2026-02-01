import type { UISchemaField } from '@screamform/core/domain/schema/types';
import { describe, it, expect, vi } from 'bun:test';
import { captureInput } from '@screamform/core/use-cases/capture-input';

describe('Use Case: captureInput', () => {
	const textField: UISchemaField = { label: 'Name', widget: 'text' };
	const numField: UISchemaField = { label: 'Age', widget: 'number' };
	const sliderField: UISchemaField = { label: 'Volume', widget: 'slider' };
	const checkboxField: UISchemaField = { label: 'Active', widget: 'checkbox' };
	const switchField: UISchemaField = { label: 'Enabled', widget: 'switch' };
	const multiSelectField: UISchemaField = {
		label: 'Tags',
		widget: 'multi-select',
	};
	const tagsField: UISchemaField = { label: 'Categories', widget: 'tags' };

	it('should trim whitespace from strings', () => {
		const result = captureInput('name', '  John Doe  ', '', textField);
		expect(result.value).toBe('John Doe');
	});

	it('should coerce strings to numbers for number widgets', () => {
		const result = captureInput<number | null>('age', '25', null, numField);
		expect(result.value).toBe(25);
		expect(typeof result.value).toBe('number');
	});

	it('should return null for empty strings on number widgets', () => {
		const result = captureInput<number | null>('age', '', 25, numField);
		expect(result.value).toBe(null);
	});

	it('should coerce strings to numbers for slider widgets', () => {
		const result = captureInput<number | null>('volume', '75', 50, sliderField);
		expect(result.value).toBe(75);
		expect(typeof result.value).toBe('number');
	});

	it('should return null for empty strings on slider widgets', () => {
		const result = captureInput<number | null>('volume', '', 50, sliderField);
		expect(result.value).toBe(null);
	});

	it('should coerce to boolean for checkbox widgets', () => {
		const result1 = captureInput<boolean>('active', true, false, checkboxField);
		expect(result1.value).toBe(true);

		const result2 = captureInput<boolean>('active', 0, true, checkboxField);
		expect(result2.value).toBe(false);

		const result3 = captureInput<boolean>(
			'active',
			'yes',
			false,
			checkboxField,
		);
		expect(result3.value).toBe(true);
	});

	it('should coerce to boolean for switch widgets', () => {
		const result1 = captureInput<boolean>('enabled', true, false, switchField);
		expect(result1.value).toBe(true);

		const result2 = captureInput<boolean>('enabled', '', true, switchField);
		expect(result2.value).toBe(false);
	});

	it('should ensure array for multi-select widgets', () => {
		const result1 = captureInput<unknown[]>(
			'tags',
			['tag1', 'tag2'],
			[],
			multiSelectField,
		);
		expect(result1.value).toEqual(['tag1', 'tag2']);

		const result2 = captureInput<unknown[]>(
			'tags',
			'not-an-array',
			[],
			multiSelectField,
		);
		expect(result2.value).toEqual([]);
	});

	it('should ensure array for tags widgets', () => {
		const result1 = captureInput<unknown[]>(
			'categories',
			['cat1', 'cat2'],
			[],
			tagsField,
		);
		expect(result1.value).toEqual(['cat1', 'cat2']);

		const result2 = captureInput<unknown[]>('categories', null, [], tagsField);
		expect(result2.value).toEqual([]);
	});

	it('should log to console when isDebug is true and values differ', () => {
		const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
		captureInput('name', 'Jane', 'John', textField, { isDebug: true });
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('INPUT_CHANGE'),
		);
		consoleSpy.mockRestore();
	});

	it('should not log when isDebug is false', () => {
		const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
		captureInput('name', 'Jane', 'John', textField, { isDebug: false });
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should not log when values are the same', () => {
		const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
		captureInput('name', 'John', 'John', textField, { isDebug: true });
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should return correct key in result', () => {
		const result = captureInput('testKey', 'value', '', textField);
		expect(result.key).toBe('testKey');
	});
});
