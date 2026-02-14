import { FieldBuilder } from './field-builder';
import { SectionBuilder } from './section-builder';

/**
 * Standalone factory functions for creating reusable field/section configurations.
 *
 * Usage:
 *   const emailField = createTextField('email')
 *     .withLabel('Email')
 *     .required()
 *     .build();
 *
 *   const schema = new FormBuilder()
 *     .addField(emailField.key, emailField.field)
 *     .build();
 */

/** Create a standalone text field builder. */
export const createTextField = (key: string): FieldBuilder<never> =>
	new FieldBuilder<never>(key, 'text');

/** Create a standalone number field builder. */
export const createNumberField = (key: string): FieldBuilder<never> =>
	new FieldBuilder<never>(key, 'number');

/** Create a standalone select field builder. */
export const createSelectField = (key: string): FieldBuilder<never> =>
	new FieldBuilder<never>(key, 'select');

/** Create a standalone checkbox field builder. */
export const createCheckboxField = (key: string): FieldBuilder<never> =>
	new FieldBuilder<never>(key, 'checkbox');

/** Create a standalone custom widget field builder. */
export const createCustomField = (
	key: string,
	widget: string,
): FieldBuilder<never> => new FieldBuilder<never>(key, widget);

/** Create a standalone section builder. */
export const createSection = (key: string): SectionBuilder<never> =>
	new SectionBuilder<never>(key);
