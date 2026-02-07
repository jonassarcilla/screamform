import { createLogger } from '../use-cases/logger';
import { evaluateLogic } from '../domain/rules/evaluator';
import type {
	UISchema,
	FieldRule,
	ValidationGroup,
	ValidationRule,
	UISchemaField,
	PrimitiveType,
	LogicValue,
} from '../domain/schema/types';
import { evaluateValidation } from '../domain/schema/validator';
import { sanitizeFormData } from '../domain/transformation/sanitizer';
import { PathResolver } from '../domain/transformation/path-resolver';
import type { FormState, FieldState } from './types';

/** Default dataType when schema does not set field.dataType. Aligns with process-submission/sanitizer. */
function getDefaultDataTypeForWidget(widget: string): PrimitiveType {
	switch (widget) {
		case 'number-input':
		case 'number':
		case 'slider':
			return 'number';
		case 'checkbox':
		case 'switch':
			return 'boolean';
		case 'date':
		case 'date-picker':
			return 'date';
		default:
			return 'string';
	}
}

export const getFieldState = (
	schema: UISchema,
	rawData: Record<string, unknown>,
	configData: Record<string, unknown> = {},
	options?: { isDebug?: boolean },
): FormState => {
	const logger = createLogger({
		isDebug: !!options?.isDebug,
		prefix: 'getFieldState',
	});
	const cleanData = sanitizeFormData(schema, rawData);

	const fields = processFields(schema.fields, cleanData, configData);

	const isValid = !Object.values(fields).some(
		(f) => f.isVisible && f.error !== null,
	);
	logger.debug('computed state', {
		fieldCount: Object.keys(fields).length,
		isValid,
		visibleWithError: Object.entries(fields)
			.filter(([, f]) => f.isVisible && f.error !== null)
			.map(([k, f]) => ({ key: k, error: f.error })),
	});
	return {
		fields,
		isValid,
		data: cleanData,
	};
};

function processFields(
	fields: Record<string, UISchemaField>,
	workingData: Record<string, unknown>,
	configData: Record<string, unknown>,
): Record<string, FieldState> {
	const stateMap: Record<string, FieldState> = {};

	for (const [key, field] of Object.entries(fields)) {
		const effects = calculateEffects(field.rules, workingData);

		// 1. Visibility & Basic Logic
		const hasShowRule = (
			Array.isArray(field.rules)
				? field.rules
				: field.rules
					? [field.rules]
					: []
		).some((r) => r.effect === 'SHOW');

		const isVisible = hasShowRule ? effects.has('SHOW') : !effects.has('HIDE');
		const isDisabled = !!effects.has('DISABLE');
		const isRequired = effects.has('REQUIRE')
			? true
			: effects.has('OPTIONAL')
				? false
				: checkIsRequired(field.validation);

		// 2. Value Resolution
		let value: LogicValue = workingData[key] as LogicValue;
		if (value === null || value === undefined) {
			const path = field.bindPath || key;
			const configValue = PathResolver.get(configData, path) as LogicValue;
			value =
				configValue !== undefined
					? configValue
					: (field.defaultValue ?? getFallbackValue(field.widget));
		}

		if (field.template && typeof value === 'string') {
			value = resolveTemplate(
				field.template,
				workingData as Record<string, unknown>,
			);
		}

		// 3. 🟢 TYPE DETECTION & PREFIX LOGIC (The "Excel" Feature)
		const schemaDataType = Array.isArray(field.dataType)
			? field.dataType[0]
			: field.dataType;
		let dataType: PrimitiveType =
			schemaDataType ?? getDefaultDataTypeForWidget(field.widget);
		if (typeof value === 'string' && value.startsWith('=')) {
			dataType = 'code';
		}
		const dataTypes = Array.isArray(field.dataType)
			? (field.dataType as string[])
			: undefined;

		// 4. 🟢 UI PROPS & CONSTRAINT FLATTENING
		const uiProps = field.uiProps || {};
		const maxItems = uiProps.maxItems;

		// 5. itemSchema recursion (nested / array children)
		let children:
			| Record<string, FieldState>
			| Record<string, FieldState>[]
			| undefined;
		if (field.itemSchema) {
			const itemSchema = field.itemSchema;
			if (Array.isArray(value)) {
				children = value.map((itemData) =>
					processFields(
						itemSchema,
						(itemData &&
						typeof itemData === 'object' &&
						!Array.isArray(itemData)
							? itemData
							: {}) as Record<string, unknown>,
						{},
					),
				);
			} else {
				const nested =
					value && typeof value === 'object' && !Array.isArray(value)
						? (value as Record<string, unknown>)
						: {};
				children = processFields(itemSchema, nested, {});
			}
		}

		// 6. Validation logic
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
			label: (field.uiProps?.label as string | undefined) ?? field.label,
			widget: field.widget,
			placeholder:
				(field.uiProps?.placeholder as string | undefined) ??
				field.placeholder ??
				'',
			description:
				(field.uiProps?.description as string | undefined) ?? field.description,
			dataType,
			...(dataTypes !== undefined && { dataTypes }),
			multiple: !!(field.multiple ?? field.widget === 'multi-select'),
			options: field.options || [],
			maxItems,
			uiProps,
			...(children !== undefined && { children }),
		};
	}

	return stateMap;
}

function getFallbackValue(widget: string): LogicValue {
	const fallbacks: Record<string, LogicValue> = {
		checkbox: false,
		switch: false,
		'multi-select': [],
		tags: [],
		number: 0,
		slider: 0,
	};
	return fallbacks[widget] ?? '';
}

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

function checkIsRequired(
	rule: ValidationGroup | ValidationRule | undefined,
): boolean {
	if (!rule) return false;
	if ('rules' in rule) return rule.rules.some(checkIsRequired);
	return rule.type === 'required';
}
