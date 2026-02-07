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
 * UTILS: Helpful constants
 */
export declare const ENGINE_VERSION = '1.0.0';
//# sourceMappingURL=index.d.ts.map
