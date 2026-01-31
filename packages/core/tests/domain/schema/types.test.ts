import { describe, test, expect, expectTypeOf } from 'bun:test';
import type {
	RuleEffect,
	UIPropValue,
	UISchema,
	UISchemaField,
} from '@screamform/core/domain/schema/types';

describe('Domain: Schema Types', () => {
	test('RuleEffect should only allow valid business actions', () => {
		// This ensures we didn't accidentally remove 'REQUIRE' or 'SHOW'
		expectTypeOf<RuleEffect>().toEqualTypeOf<
			'SHOW' | 'HIDE' | 'DISABLE' | 'ENABLE' | 'REQUIRE' | 'OPTIONAL'
		>();
	});

	test("uiProps should be strictly serializable (No 'any' allowed)", () => {
		// This proves we've successfully banned 'any'
		expectTypeOf<UISchemaField['uiProps']>().not.toBeAny();

		// This confirms it accepts complex but safe objects
		type SampleProps = { mask: string; theme: { color: string } };
		expectTypeOf<SampleProps>().toMatchTypeOf<Record<string, UIPropValue>>();
	});

	test("UISchema must follow the 'Record<string, Field>' pattern", () => {
		expectTypeOf<UISchema['fields']>().toEqualTypeOf<
			Record<string, UISchemaField>
		>();
	});

	test('should enforce serializable field structures', () => {
		const schema: UISchema = {
			fields: {
				'profile.avatar': {
					label: 'Avatar',
					widget: 'image-upload',
					rules: {
						effect: 'SHOW',
						condition: { field: 'hasProfile', operator: '===', value: true },
					},
				},
			},
		};

		const profileAvatar = schema.fields['profile.avatar'];
		expect(profileAvatar).toBeDefined();
		expect(profileAvatar?.label).toBe('Avatar');
	});

	test("should support structured uiProps without using 'any'", () => {
		const schema: UISchema = {
			fields: {
				phone: {
					label: 'Phone Number',
					widget: 'text',
					uiProps: {
						mask: '(000) 000-0000',
						prefixIcon: 'phone-icon',
						styles: {
							color: 'blue',
							fontWeight: 700,
						},
					},
				},
			},
		};

		const uiProps = schema.fields['phone']?.uiProps;
		expect(uiProps?.mask).toBe('(000) 000-0000');

		// TypeScript knows 'styles' is a UIPropValue (object)
		const styles = uiProps?.styles as Record<string, UIPropValue>;
		expect(styles.color).toBe('blue');
	});
});
