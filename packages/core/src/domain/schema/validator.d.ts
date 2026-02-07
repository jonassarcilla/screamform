import type { ValidationRule, ValidationGroup, UISchema } from './types';
/**
 * RECURSIVE ENGINE: This handles AND, OR, and NOT.
 * It returns the errorMessage (string) if it fails, or null if it passes.
 */
export declare const evaluateValidation: (
	node: ValidationGroup | ValidationRule,
	value: unknown,
) => string | null;
/**
 * THE GATEKEEPER: The main function used by the engine.
 */
export declare const validateFormData: (
	schema: UISchema,
	data: Record<string, unknown>,
) => {
	success: boolean;
	errors: Record<string, string>;
};
//# sourceMappingURL=validator.d.ts.map
