import type {
	ValidationRule,
	ValidationGroup,
	UISchema,
	LogicValue,
} from './types';
import { DEFAULT_VALIDATION_MESSAGES } from '../constants/validation-messages';

const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number';

/**
 * BASE CHECKER: Runtime type checks and rule logic.
 * Returns true (valid) or false (invalid).
 */
const checkRule = (rule: ValidationRule, value: unknown): boolean => {
	switch (rule.type) {
		case 'required':
			return value !== null && value !== undefined && value !== '';

		case 'regex':
			return isString(value) && new RegExp(rule.value as string).test(value);

		case 'startsWith':
			return (
				isString(value) && isString(rule.value) && value.startsWith(rule.value)
			);

		case 'endsWith':
			return (
				isString(value) && isString(rule.value) && value.endsWith(rule.value)
			);

		case 'in':
			return (
				Array.isArray(rule.value) &&
				rule.value.includes(value as string | number)
			);

		case 'min':
			return isNumber(value) && isNumber(rule.value) && value >= rule.value;

		case 'max':
			return isNumber(value) && isNumber(rule.value) && value <= rule.value;

		case 'contains':
			if (Array.isArray(value)) return value.includes(rule.value as LogicValue);
			if (isString(value)) return value.includes(String(rule.value));
			return false;

		default:
			return true;
	}
};

const getErrorMessage = (rule: ValidationRule): string => {
	return (
		rule.errorMessage ||
		DEFAULT_VALIDATION_MESSAGES[rule.type] ||
		'Invalid value'
	);
};

/**
 * RECURSIVE ENGINE: This handles AND, OR, and NOT.
 * It returns the errorMessage (string) if it fails, or null if it passes.
 */
export const evaluateValidation = (
	node: ValidationGroup | ValidationRule,
	value: unknown,
): string | null => {
	// --- BASE CASE: Single Leaf Rule ---
	if ('type' in node) {
		// We pass the rule to checkRule, and if it fails, we fetch the message
		return checkRule(node, value) ? null : getErrorMessage(node);
	}

	// --- RECURSIVE CASE: Logic Branch (Groups) ---
	const results = node.rules.map((r) => evaluateValidation(r, value));

	switch (node.operator) {
		case 'and':
			return results.find((res) => res !== null) || null;

		case 'or': {
			const anyValid = results.some((res) => res === null);
			if (anyValid) return null;
			const firstResult = results.find((res) => res !== null);
			return firstResult || 'None of the required conditions were met';
		}

		case 'not': {
			const firstError = results[0];
			return firstError !== null
				? null
				: 'This value is specifically disallowed';
		}

		default:
			return null;
	}
};

/**
 * THE GATEKEEPER: The main function used by the engine.
 */
export const validateFormData = (
	schema: UISchema,
	data: Record<string, unknown>,
) => {
	const errors: Record<string, string> = {};

	for (const [key, field] of Object.entries(schema.fields)) {
		if (field.validation) {
			const error = evaluateValidation(field.validation, data[key]);
			if (error) errors[key] = error;
		}
	}

	return {
		success: Object.keys(errors).length === 0,
		errors,
	};
};
