import { createLogger } from '../use-cases/logger';
import { evaluateLogic } from '../domain/rules/evaluator';
import type {
	UISchema,
	FieldRule,
	ValidationGroup,
	ValidationRule,
	UISchemaField,
} from '../domain/schema/types';
import { evaluateValidation } from '../domain/schema/validator';
import { sanitizeFormData } from '../domain/transformation/sanitizer';
import { PathResolver } from '../domain/transformation/path-resolver';
import type { FormState, FieldState } from './types';

/**
 * THE ORCHESTRATOR: Respecting RuleEffects and Transformations
 */
export const getFieldState = (
	schema: UISchema,
	rawData: Record<string, unknown>,
	configData: Record<string, unknown> = {},
	options?: { isDebug?: boolean },
): FormState => {
	const logger = createLogger({ isDebug: !!options?.isDebug });
	logger.debug('Processing Form State', { rawData, configData });

	const cleanData = sanitizeFormData(schema, rawData);

	// We extract the core field processing into a reusable function
	const fields = processFields(schema.fields, cleanData, configData);

	const state = {
		fields,
		isValid: !Object.values(fields).some(
			(f) => f.isVisible && f.error !== null,
		),
		data: cleanData,
	};

	if (!state.isValid) {
		logger.warn('Form state is currently invalid', state.fields);
	}

	return state;
};

/**
 * Maps schema fields to their UI state, handling recursion for itemSchema
 */
function processFields(
	fields: Record<string, UISchemaField>,
	workingData: Record<string, unknown>,
	configData: Record<string, unknown>,
): Record<string, FieldState> {
	const stateMap: Record<string, FieldState> = {};

	for (const [key, field] of Object.entries(fields)) {
		// Logic evaluation usually happens against the current working state
		const effects = calculateEffects(field.rules, workingData);

		const hasShowRule = (
			Array.isArray(field.rules)
				? field.rules
				: field.rules
					? [field.rules]
					: []
		).some((r) => r.effect === 'SHOW');

		const isVisible = hasShowRule
			? effects.has('SHOW')
			: effects.has('HIDE')
				? false
				: true;

		const isDisabled = !!effects.has('DISABLE');
		const isRequired = effects.has('REQUIRE')
			? true
			: effects.has('OPTIONAL')
				? false
				: checkIsRequired(field.validation);

		// --- DATA CONFIG & PATH BINDING START ---

		// 1. Check if user is currently typing this field (Flat Key)
		let value = workingData[key];

		if (value === null || value === undefined) {
			// 2. If not typing, try to reach into dataConfig using bindPath or key
			const path = field.bindPath || key;
			const configValue = PathResolver.get(configData, path);

			// 3. If no config value, use schema defaultValue or widget fallback
			value =
				configValue !== undefined
					? configValue
					: (field.defaultValue ?? getFallbackValue(field.widget));
		}

		// --- DATA CONFIG & PATH BINDING END ---

		if (field.template) value = resolveTemplate(field.template, workingData);

		// Recursion for nested schemas
		let children:
			| Record<string, FieldState>
			| Record<string, FieldState>[]
			| undefined = undefined;
		if (field.itemSchema) {
			const itemSchema = field.itemSchema;
			if (Array.isArray(value)) {
				children = value.map((itemData) =>
					processFields(itemSchema, itemData, {}),
				);
			} else {
				const nested =
					value && typeof value === 'object' && !Array.isArray(value)
						? (value as Record<string, unknown>)
						: {};
				children = processFields(itemSchema, nested, {});
			}
		}

		// Validation logic
		let error: string | null = null;
		if (isVisible && !isDisabled) {
			const isEmpty = value === null || value === undefined || value === '';
			if (effects.has('OPTIONAL') && isEmpty) {
				error = null;
			} else if (field.validation) {
				error = evaluateValidation(field.validation, value);
			} else if (isRequired && isEmpty) {
				error = 'This field is required';
			}
		}

		stateMap[key] = {
			value,
			isVisible,
			isDisabled,
			error,
			isRequired,
			label: field.label,
			widget: field.widget,
			placeholder: field.placeholder || '',
			description: field.description,
			options: field.options || [],
			uiProps: field.uiProps || {},
			children,
		};
	}

	return stateMap;
}

/**
 * Ensures your UI components always receive a controlled value.
 */
function getFallbackValue(widget: string): unknown {
	const fallbacks: Record<string, unknown> = {
		checkbox: false,
		switch: false,
		'multi-select': [],
		tags: [],
		number: 0,
		slider: 0,
		object: {},
	};
	// Default to empty string for text, select, date, etc.
	return fallbacks[widget] ?? '';
}

/**
 * Reduces multiple rules into a Set of active effects
 */
function calculateEffects(
	rules: FieldRule | FieldRule[] | undefined,
	data: Record<string, unknown>,
): Set<string> {
	const activeEffects = new Set<string>();
	if (!rules) return activeEffects;

	const ruleArray = Array.isArray(rules) ? rules : [rules];
	for (const rule of ruleArray) {
		if (evaluateLogic(rule.condition, data)) {
			activeEffects.add(rule.effect);
		}
	}
	return activeEffects;
}

/**
 * Resolves {{dot.notation}} templates
 */
function resolveTemplate(
	template: string,
	data: Record<string, unknown>,
): string {
	return template.replace(/\{\{(.*?)\}\}/g, (_match: string, path: string) => {
		const keys = path.trim().split('.');
		const val = keys.reduce<unknown>(
			(prev: unknown, curr: string) =>
				prev !== null &&
				prev !== undefined &&
				typeof prev === 'object' &&
				curr in (prev as Record<string, unknown>)
					? (prev as Record<string, unknown>)[curr]
					: undefined,
			data,
		);
		return val != null ? String(val) : '';
	});
}

/**
 * Deep search for 'required' type in Validation tree
 */
function checkIsRequired(
	rule: ValidationGroup | ValidationRule | undefined,
): boolean {
	if (!rule) return false;
	if ('rules' in rule) return rule.rules.some(checkIsRequired);
	return rule.type === 'required';
}
