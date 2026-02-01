import { describe, test } from 'bun:test';
import { expectTypeOf } from 'expect-type';
import type { FieldState, FormState } from '@screamform/core/use-cases/types';

describe('Use Case: Types', () => {
	test('FieldState has required UI contract', () => {
		expectTypeOf<FieldState>().toMatchTypeOf<{
			value: unknown;
			isVisible: boolean;
			isDisabled: boolean;
			error: string | null;
			isRequired: boolean;
			widget: string;
			placeholder: string;
		}>();
	});

	test('FieldState allows optional label, description, options, uiProps, children', () => {
		expectTypeOf<{ label?: string; description?: string }>().toExtend<
			Pick<FieldState, 'label' | 'description'>
		>();
		expectTypeOf<FieldState>().toHaveProperty('options');
		expectTypeOf<FieldState>().toHaveProperty('uiProps');
		expectTypeOf<FieldState>().toHaveProperty('children');
	});

	test('FieldState.children is Record or array of Record', () => {
		type ExpectedChildren =
			| Record<string, FieldState>
			| Record<string, FieldState>[];
		expectTypeOf<FieldState['children']>().toMatchTypeOf<
			ExpectedChildren | undefined
		>();
	});

	test('FormState has fields, isValid, and data', () => {
		expectTypeOf<FormState>().toMatchTypeOf<{
			fields: Record<string, FieldState>;
			isValid: boolean;
			data: Record<string, unknown>;
		}>();
	});

	test('FormState.fields is Record<string, FieldState>', () => {
		expectTypeOf<FormState['fields']>().toEqualTypeOf<
			Record<string, FieldState>
		>();
	});
});
