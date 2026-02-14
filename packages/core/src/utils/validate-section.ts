import type { UISchema, UISchemaField } from '../domain/schema/types';
import { evaluateValidation } from '../domain/schema/validator';

export interface SectionValidationResult {
	/** Whether all fields in the section are valid */
	isValid: boolean;
	/** Map of field key → error message (only fields with errors) */
	errors: Record<string, string>;
}

/**
 * Validates only the fields within a specified section of a UISchema.
 * Useful for wizard-form step validation.
 *
 * @param schema - The full UISchema.
 * @param sectionKey - The key of the section field to validate.
 * @param data - The current form data (section's value should be an object with child keys).
 * @returns Validation result with isValid flag and error map.
 */
export const validateSection = (
	schema: UISchema,
	sectionKey: string,
	data: Record<string, unknown>,
): SectionValidationResult => {
	const sectionField = schema.fields[sectionKey];
	if (!sectionField) {
		return { isValid: true, errors: {} };
	}

	const itemSchema = sectionField.itemSchema;
	if (!itemSchema) {
		return { isValid: true, errors: {} };
	}

	// Get the section's data (should be an object)
	const sectionData = data[sectionKey];
	const sectionObj =
		sectionData &&
		typeof sectionData === 'object' &&
		!Array.isArray(sectionData)
			? (sectionData as Record<string, unknown>)
			: {};

	return validateFields(itemSchema, sectionObj);
};

function validateFields(
	fields: Record<string, UISchemaField>,
	data: Record<string, unknown>,
): SectionValidationResult {
	const errors: Record<string, string> = {};

	for (const [key, field] of Object.entries(fields)) {
		const value = data[key];

		if (field.validation) {
			const error = evaluateValidation(field.validation, value);
			if (error !== null) {
				errors[key] = error;
			}
		}
		// Fields without validation are treated as optional
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
}
