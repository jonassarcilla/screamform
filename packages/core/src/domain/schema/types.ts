/**
 * Primitive types for data identity and UI rendering.
 * 'code' is triggered dynamically when a value starts with '='.
 */
export type PrimitiveType = 'string' | 'number' | 'boolean' | 'date' | 'code';

/**
 * Supported values for logic and form state.
 */
export type LogicValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| LogicValue[];

export type LogicOperator = 'and' | 'or' | 'not';

export type RuleEffect =
	| 'SHOW'
	| 'HIDE'
	| 'DISABLE'
	| 'ENABLE'
	| 'REQUIRE'
	| 'OPTIONAL';

export type TransformKeyword =
	| 'unix'
	| 'number'
	| 'boolean'
	| 'trim'
	| 'template'
	| 'uppercase'
	| 'lowercase';

/**
 * Select Option structure for dropdowns and radio groups.
 */
export interface SelectOption {
	label: string;
	value: LogicValue;
}

// --- Logic & Validation Structures ---

export interface Condition {
	field: string;
	operator:
		| '==='
		| '!=='
		| '>'
		| '<'
		| '>='
		| '<='
		| 'contains'
		| 'empty'
		| 'startsWith'
		| 'endsWith'
		| 'in';
	value?: LogicValue | LogicValue[];
}

export interface LogicGroup {
	operator: LogicOperator;
	conditions: Array<Condition | LogicGroup>;
}

export interface FieldRule {
	effect: RuleEffect;
	condition: LogicGroup | Condition;
}

export interface ValidationRule {
	type:
		| 'required'
		| 'regex'
		| 'min'
		| 'max'
		| 'contains'
		| 'startsWith'
		| 'endsWith'
		| 'in';
	value?: string | number | boolean | Array<string | number>;
	errorMessage?: string;
}

export interface ValidationGroup {
	operator: 'and' | 'or' | 'not';
	rules: Array<ValidationGroup | ValidationRule>;
}

// --- Schema & State ---

export type UIPropValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| UIPropValue[]
	| { [key: string]: UIPropValue };

/**
 * The Field Definition (The JSON Blueprint).
 */
export interface UISchemaField {
	label: string;
	widget: string;
	dataType?: PrimitiveType; // 🟢 Explicit type enforcement
	defaultValue?: LogicValue;
	placeholder?: string;
	description?: string;
	autoSave?: boolean;
	bindPath?: string;
	multiple?: boolean;

	transform?: TransformKeyword;
	template?: string;

	rules?: FieldRule | FieldRule[];
	validation?: ValidationGroup | ValidationRule;

	itemSchema?: Record<string, UISchemaField>;

	options?: SelectOption[];

	/**
	 * Extra UI configurations.
	 * Constraints like maxItems live here in the schema.
	 */
	uiProps?: {
		maxItems?: number;
		[key: string]: UIPropValue;
	};
}

export interface UISchema {
	exclude?: string[];
	fields: Record<string, UISchemaField>;
	settings?: {
		debug?: boolean;
		submitLabel?: string;
	};
}
