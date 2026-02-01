import type { FieldState } from './types';
import type { UISchema } from '../domain/schema/types';
import { getFieldState } from './get-field-state';

export interface AutoSaveResult {
	shouldSave: boolean;
	payload: Record<string, unknown>;
}

/**
 * THE PROTECTOR: Determines what data is safe and mature enough for a draft save.
 */
export const handleAutoSave = (
	schema: UISchema,
	rawData: Record<string, unknown>,
): AutoSaveResult => {
	// 1. Get the current state (Visibility, Enablement, Requirement, and Errors)
	const state = getFieldState(schema, rawData);

	const payload: Record<string, unknown> = {};
	let hasChangesToSave = false;

	for (const [key, fieldSchema] of Object.entries(schema.fields)) {
		const fieldState = state.fields[key];
		if (!fieldState) continue;

		/**
		 * AUTO-SAVE DECISION MATRIX:
		 * We skip the field if:
		 * - autoSave is false in schema.
		 * - Field is currently Hidden (Security).
		 * - Field is currently Disabled (Read-only/System locked).
		 * - Field has an active Validation Error (Regex, etc.).
		 * - Field is REQUIRED but currently empty.
		 */
		const isEmpty =
			fieldState.value === null ||
			fieldState.value === undefined ||
			fieldState.value === '';

		const satisfiesRequirement = fieldState.isRequired ? !isEmpty : true;

		const isReadyForSave =
			fieldSchema.autoSave &&
			fieldState.isVisible &&
			!fieldState.isDisabled &&
			!fieldState.error &&
			satisfiesRequirement;

		if (isReadyForSave) {
			if (fieldState.children) {
				payload[key] = extractRecursiveAutoSave(fieldState);
			} else {
				payload[key] = fieldState.value;
			}
			hasChangesToSave = true;
		}
	}

	return {
		shouldSave: hasChangesToSave,
		payload,
	};
};

/**
 * Helper to handle nested itemSchema auto-saves.
 * Recursively extracts visible, non-error values from FieldState children.
 * Exported for tests to cover single-object branch (lines 91-92).
 */
export function extractRecursiveAutoSave(
	field: FieldState,
): Record<string, unknown> | Record<string, unknown>[] | unknown {
	if (Array.isArray(field.children)) {
		return field.children.map((childGroup) => {
			const groupPayload: Record<string, unknown> = {};
			for (const [k, subField] of Object.entries(childGroup)) {
				if (!subField.isVisible || subField.error) continue;
				if (subField.children) {
					groupPayload[k] = extractRecursiveAutoSave(subField);
				} else {
					groupPayload[k] = subField.value;
				}
			}
			return groupPayload;
		});
	}
	// Single nested object (not array): field.children is Record<string, FieldState>
	if (
		field.children != null &&
		typeof field.children === 'object' &&
		!Array.isArray(field.children)
	) {
		const single: Record<string, unknown> = {};
		const childrenObj = field.children as Record<string, FieldState>;
		for (const [k, subField] of Object.entries(childrenObj)) {
			if (!subField.isVisible || subField.error) continue;
			if (subField.children) {
				single[k] = extractRecursiveAutoSave(subField);
			} else {
				single[k] = subField.value;
			}
		}
		return single;
	}
	return field.value;
}
