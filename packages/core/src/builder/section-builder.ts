import type {
	UISchemaField,
	DataClassification,
	FieldRule,
	LogicValue,
	UIPropValue,
	ValidationGroup,
	ValidationRule,
} from '../domain/schema/types';
import { FieldBuilder } from './field-builder';
import type { ConditionTuple } from './rules';
import { tupleToRule, tuplesToRule } from './rules';

/**
 * Fluent builder for configuring a section (nested field group).
 * Acts as both a field and a container for child fields.
 *
 * TParent is the type returned by .done() — either FormBuilder or another SectionBuilder.
 */
export class SectionBuilder<TParent = never> {
	private readonly _key: string;
	private readonly _parent: TParent | null;
	private readonly _sectionField: Partial<UISchemaField>;
	private readonly _children: Map<string, UISchemaField> = new Map();

	constructor(key: string, parent: TParent | null = null) {
		this._key = key;
		this._parent = parent;
		this._sectionField = { widget: 'section' };
	}

	// --- Section-level properties ---

	withLabel(label: string): this {
		this._sectionField.label = label;
		return this;
	}

	description(description: string): this {
		this._sectionField.description = description;
		return this;
	}

	sensitivity(classification: DataClassification): this {
		this._sectionField.sensitivity = classification;
		return this;
	}

	defaultValue(value: LogicValue): this {
		this._sectionField.defaultValue = value;
		return this;
	}

	bindPath(path: string): this {
		this._sectionField.bindPath = path;
		return this;
	}

	uiProps(props: Record<string, UIPropValue>): this {
		this._sectionField.uiProps = { ...this._sectionField.uiProps, ...props };
		return this;
	}

	validation(rules: ValidationGroup | ValidationRule): this {
		this._sectionField.validation = rules;
		return this;
	}

	// --- Section-level rules ---

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

	showWhenAll(tuples: ConditionTuple[]): this {
		this._addRule(tuplesToRule('SHOW', tuples, 'and'));
		return this;
	}

	showWhenAny(tuples: ConditionTuple[]): this {
		this._addRule(tuplesToRule('SHOW', tuples, 'or'));
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

	disableWhenAny(tuples: ConditionTuple[]): this {
		this._addRule(tuplesToRule('DISABLE', tuples, 'or'));
		return this;
	}

	rawRules(rules: FieldRule | FieldRule[]): this {
		const ruleArray = Array.isArray(rules) ? rules : [rules];
		for (const rule of ruleArray) {
			this._addRule(rule);
		}
		return this;
	}

	// --- Child field methods ---

	addTextField(key: string): FieldBuilder<this> {
		return this._createFieldBuilder(key, 'text');
	}

	addNumberField(key: string): FieldBuilder<this> {
		return this._createFieldBuilder(key, 'number');
	}

	addSelectField(key: string): FieldBuilder<this> {
		return this._createFieldBuilder(key, 'select');
	}

	addCheckboxField(key: string): FieldBuilder<this> {
		return this._createFieldBuilder(key, 'checkbox');
	}

	addCustomField(key: string, widget: string): FieldBuilder<this> {
		return this._createFieldBuilder(key, widget);
	}

	/** Nested section within this section. */
	addSection(key: string): SectionBuilder<this> {
		const section = new SectionBuilder<this>(key, this);
		return section;
	}

	/** Add a pre-built field config (from standalone factory or raw object). */
	addField(key: string, field: UISchemaField): this {
		this._children.set(key, field);
		return this;
	}

	// --- Terminal methods ---

	/** Finalize and return to parent builder. */
	done(): TParent {
		if (this._parent === null) {
			throw new Error(
				'SectionBuilder.done() called in standalone mode. Use .build() instead.',
			);
		}
		// Register this section with the parent
		const built = this._buildField();
		if (this._parent instanceof SectionBuilder) {
			(this._parent as SectionBuilder<unknown>)._children.set(this._key, built);
		}
		return this._parent;
	}

	/** Build and return the section field config. Used internally and in standalone mode. */
	build(): { key: string; field: UISchemaField } {
		return {
			key: this._key,
			field: this._buildField(),
		};
	}

	/** Get the field key. */
	getKey(): string {
		return this._key;
	}

	// --- Internal ---

	/** Build the UISchemaField for this section. */
	_buildField(): UISchemaField {
		const itemSchema: Record<string, UISchemaField> = {};
		for (const [childKey, childField] of this._children) {
			itemSchema[childKey] = childField;
		}

		return {
			label: this._sectionField.label ?? this._key,
			...this._sectionField,
			...(Object.keys(itemSchema).length > 0 && { itemSchema }),
		} as UISchemaField;
	}

	/** Register a child field built by FieldBuilder when .done() is called. */
	_registerChild(key: string, field: UISchemaField): void {
		this._children.set(key, field);
	}

	private _createFieldBuilder(key: string, widget: string): FieldBuilder<this> {
		const fb = new FieldBuilder<this>(key, widget, this);
		// Override the FieldBuilder.done() to also register the field in this section
		const originalDone = fb.done.bind(fb);
		fb.done = (): this => {
			const { key: fieldKey, field } = fb.build();
			this._children.set(fieldKey, field);
			return originalDone() as unknown as this;
		};
		return fb;
	}

	private _addRule(rule: FieldRule): void {
		const existing = this._sectionField.rules;
		if (!existing) {
			this._sectionField.rules = rule;
		} else if (Array.isArray(existing)) {
			existing.push(rule);
		} else {
			this._sectionField.rules = [existing, rule];
		}
	}
}
