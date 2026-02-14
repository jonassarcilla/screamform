import type {
	DataClassification,
	FieldRule,
	LogicValue,
	PrimitiveType,
	SelectOption,
	TransformKeyword,
	UIPropValue,
	UISchemaField,
	ValidationGroup,
	ValidationRule,
} from '../domain/schema/types';
import type { ConditionTuple } from './rules';
import { tupleToRule, tuplesToRule } from './rules';

/**
 * Fluent builder for configuring a single field.
 *
 * TParent is the type returned by .done() — either FormBuilder or SectionBuilder.
 * When used standalone (via factories), TParent is never (use .build() instead).
 */
export class FieldBuilder<TParent = never> {
	private readonly _key: string;
	private readonly _parent: TParent | null;
	private readonly _field: Partial<UISchemaField>;

	constructor(key: string, widget: string, parent: TParent | null = null) {
		this._key = key;
		this._parent = parent;
		this._field = { widget };
	}

	// --- Core properties ---

	withLabel(label: string): this {
		this._field.label = label;
		return this;
	}

	placeholder(placeholder: string): this {
		this._field.placeholder = placeholder;
		return this;
	}

	description(description: string): this {
		this._field.description = description;
		return this;
	}

	required(errorMessage = 'This field is required'): this {
		this._field.validation = {
			type: 'required',
			errorMessage,
		};
		return this;
	}

	defaultValue(value: LogicValue): this {
		this._field.defaultValue = value;
		return this;
	}

	bindPath(path: string): this {
		this._field.bindPath = path;
		return this;
	}

	dataType(type: PrimitiveType | PrimitiveType[]): this {
		this._field.dataType = type;
		return this;
	}

	autoSave(enabled = true): this {
		this._field.autoSave = enabled;
		return this;
	}

	transform(keyword: TransformKeyword): this {
		this._field.transform = keyword;
		return this;
	}

	template(tpl: string): this {
		this._field.template = tpl;
		return this;
	}

	// --- Compliance ---

	sensitivity(classification: DataClassification): this {
		this._field.sensitivity = classification;
		return this;
	}

	// --- Select/Multi-select options ---

	withOptions(options: SelectOption[]): this {
		this._field.options = options;
		return this;
	}

	multiple(maxItems?: number): this {
		this._field.multiple = true;
		if (maxItems !== undefined) {
			this._field.uiProps = { ...this._field.uiProps, maxItems };
		}
		return this;
	}

	// --- UI Props ---

	uiProps(props: Record<string, UIPropValue>): this {
		this._field.uiProps = { ...this._field.uiProps, ...props };
		return this;
	}

	// --- Rules (three-tier API) ---

	/** Simple: single condition → effect */
	showWhen(
		field: string,
		op: ConditionTuple[1],
		value?: ConditionTuple[2],
	): this {
		this._addRule(tupleToRule('SHOW', [field, op, value]));
		return this;
	}

	hideWhen(
		field: string,
		op: ConditionTuple[1],
		value?: ConditionTuple[2],
	): this {
		this._addRule(tupleToRule('HIDE', [field, op, value]));
		return this;
	}

	disableWhen(
		field: string,
		op: ConditionTuple[1],
		value?: ConditionTuple[2],
	): this {
		this._addRule(tupleToRule('DISABLE', [field, op, value]));
		return this;
	}

	enableWhen(
		field: string,
		op: ConditionTuple[1],
		value?: ConditionTuple[2],
	): this {
		this._addRule(tupleToRule('ENABLE', [field, op, value]));
		return this;
	}

	requireWhen(
		field: string,
		op: ConditionTuple[1],
		value?: ConditionTuple[2],
	): this {
		this._addRule(tupleToRule('REQUIRE', [field, op, value]));
		return this;
	}

	optionalWhen(
		field: string,
		op: ConditionTuple[1],
		value?: ConditionTuple[2],
	): this {
		this._addRule(tupleToRule('OPTIONAL', [field, op, value]));
		return this;
	}

	/** Compound: multiple conditions joined by AND */
	showWhenAll(tuples: ConditionTuple[]): this {
		this._addRule(tuplesToRule('SHOW', tuples, 'and'));
		return this;
	}

	hideWhenAll(tuples: ConditionTuple[]): this {
		this._addRule(tuplesToRule('HIDE', tuples, 'and'));
		return this;
	}

	disableWhenAll(tuples: ConditionTuple[]): this {
		this._addRule(tuplesToRule('DISABLE', tuples, 'and'));
		return this;
	}

	/** Compound: multiple conditions joined by OR */
	showWhenAny(tuples: ConditionTuple[]): this {
		this._addRule(tuplesToRule('SHOW', tuples, 'or'));
		return this;
	}

	hideWhenAny(tuples: ConditionTuple[]): this {
		this._addRule(tuplesToRule('HIDE', tuples, 'or'));
		return this;
	}

	disableWhenAny(tuples: ConditionTuple[]): this {
		this._addRule(tuplesToRule('DISABLE', tuples, 'or'));
		return this;
	}

	/** Escape hatch: raw rules for maximum flexibility */
	rawRules(rules: FieldRule | FieldRule[]): this {
		const ruleArray = Array.isArray(rules) ? rules : [rules];
		for (const rule of ruleArray) {
			this._addRule(rule);
		}
		return this;
	}

	// --- Validation ---

	validation(rules: ValidationGroup | ValidationRule): this {
		this._field.validation = rules;
		return this;
	}

	// --- Terminal methods ---

	/** Finalize and return to parent builder. Only available in inline mode. */
	done(): TParent {
		if (this._parent === null) {
			throw new Error(
				'FieldBuilder.done() called in standalone mode. Use .build() instead.',
			);
		}
		return this._parent;
	}

	/** Build and return the field key and config. Used internally and in standalone mode. */
	build(): { key: string; field: UISchemaField } {
		return {
			key: this._key,
			field: {
				label: this._field.label ?? this._key,
				...this._field,
			} as UISchemaField,
		};
	}

	/** Get the field key. */
	getKey(): string {
		return this._key;
	}

	// --- Internal ---

	private _addRule(rule: FieldRule): void {
		const existing = this._field.rules;
		if (!existing) {
			this._field.rules = rule;
		} else if (Array.isArray(existing)) {
			existing.push(rule);
		} else {
			this._field.rules = [existing, rule];
		}
	}
}
