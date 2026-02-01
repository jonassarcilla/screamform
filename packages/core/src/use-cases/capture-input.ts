import type { UISchemaField } from '../domain/schema/types';

export interface CaptureResult<T = unknown> {
	value: T;
	key: string;
}

/**
 * THE CAPTURED: Processes raw UI events with zero 'any' usage.
 * Uses Generics to ensure the returned value matches the expected type.
 */
export const captureInput = <T = unknown>(
	key: string,
	rawValue: unknown, // Changed from 'any' to 'unknown'
	oldValue: T, // Use Generic T
	fieldSchema: UISchemaField,
	options: { isDebug?: boolean } = {},
): CaptureResult<T> => {
	let newValue: unknown = rawValue;

	// 1. Sanitization & Coercion (Type-safe)
	if (typeof newValue === 'string') {
		newValue = newValue.trim();
	}

	// Handle specific widget coercions
	switch (fieldSchema.widget) {
		case 'number':
		case 'slider':
			// Coerce to number or null if empty
			newValue = newValue === '' ? null : Number(newValue);
			break;
		case 'checkbox':
		case 'switch':
			// Ensure strict boolean
			newValue = Boolean(newValue);
			break;
		case 'multi-select':
		case 'tags':
			// Ensure array
			newValue = Array.isArray(newValue) ? newValue : [];
			break;
	}

	// 2. Debug Comparison with Type-Safe Diffing
	if (options.isDebug) {
		const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

		if (hasChanged) {
			console.group(`[FormEngine] [INPUT_CHANGE]: ${key}`);
			console.log(
				`%c Previous:`,
				'color: #9E9E9E; font-weight: bold;',
				oldValue,
			);
			console.log(
				`%c Current: `,
				'color: #4CAF50; font-weight: bold;',
				newValue,
			);
			console.groupEnd();
		}
	}

	// We cast to T at the very last moment after sanitization
	return {
		key,
		value: newValue as T,
	};
};
