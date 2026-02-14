/**
 * DOMAIN: The Core DNA
 * Rules, Evaluators, and Validators
 */
export * from './domain/schema/types';
export { evaluateLogic } from './domain/rules/evaluator';
export { evaluateValidation } from './domain/schema/validator';

/**
 * TRANSFORMATIONS: Data Preparation
 */
export { sanitizeFormData } from './domain/transformation/sanitizer';

/**
 * USE CASES: The Business Logic
 * These are the primary entry points for your UI / Hooks
 */
export { getFieldState } from './use-cases/get-field-state';
export { captureInput } from './use-cases/capture-input';
export { processSubmission } from './use-cases/process-submission';
export { handleAutoSave } from './use-cases/handle-auto-save';
export { discardChanges } from './use-cases/discard-changes';

/**
 * TYPES: Public Contracts
 */
export * from './use-cases/types';

/**
 * BUILDER: Fluent API for schema construction
 */
export {
	FormBuilder,
	FieldBuilder,
	SectionBuilder,
	createTextField,
	createNumberField,
	createSelectField,
	createCheckboxField,
	createCustomField,
	createSection,
} from './builder';
export type { ConditionTuple } from './builder';

/**
 * SECURITY & COMPLIANCE: Utilities
 */
export { deepFreeze } from './utils/deep-freeze';
export { getPIIFields } from './utils/get-pii-fields';
export { validateSchema } from './utils/validate-schema';
export type { SchemaValidationIssue } from './utils/validate-schema';
export { validateSection } from './utils/validate-section';
export type { SectionValidationResult } from './utils/validate-section';

/**
 * UTILS: Helpful constants
 */
export const ENGINE_VERSION = '1.0.0';
