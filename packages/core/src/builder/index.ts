/**
 * BUILDER: Fluent API for schema construction
 */
export { FormBuilder } from './form-builder';
export { FieldBuilder } from './field-builder';
export { SectionBuilder } from './section-builder';

/**
 * FACTORIES: Standalone field/section creators
 */
export {
	createTextField,
	createNumberField,
	createSelectField,
	createCheckboxField,
	createCustomField,
	createSection,
} from './factories';

/**
 * RULES: Shared helpers for condition tuples
 */
export type { ConditionTuple } from './rules';
export {
	tupleToCondition,
	tuplesToLogicGroup,
	tupleToRule,
	tuplesToRule,
} from './rules';
