/**
 * Supported primitive types for data and logic comparison
 */
export type LogicValue = string | number | boolean | null | undefined;

/**
 * Logical operators for grouping conditions
 */
export type LogicOperator = 'and' | 'or' | 'not';

/**
 * Behavioral effects triggered by logic
 */
export type RuleEffect =
	| 'SHOW'
	| 'HIDE'
	| 'DISABLE'
	| 'ENABLE'
	| 'REQUIRE' // Field becomes mandatory
	| 'OPTIONAL'; // Field becomes optional

/**
 * Data transformation keywords for the "Exit-Gate"
 */
export type TransformKeyword =
	| 'unix'
	| 'number'
	| 'boolean'
	| 'trim'
	| 'template'
	| 'uppercase'
	| 'lowercase';

/**
 * The Leaf Node: A single comparison unit
 */
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

/**
 * The Branch Node: Recursive logic grouping (Boolean Algebra)
 */
export interface LogicGroup {
	operator: LogicOperator;
	conditions: Array<Condition | LogicGroup>;
}

/**
 * The Command: Maps a trigger to a UI effect
 */
export interface FieldRule {
	effect: RuleEffect;
	condition: LogicGroup | Condition;
}

/**
 * Primitive types that can safely be passed to UI components
 */
export type UIPropValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| UIPropValue[]
	| { [key: string]: UIPropValue };

/**
 * Leaf node: The actual check to perform.
 */
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

	/**
	 * The value to compare against.
	 * For 'in', this is an array: string[] | number[].
	 */
	value?: string | number | boolean | Array<string | number>;

	/**
	 * The "Scream": The message displayed to the user when validation fails.
	 */
	errorMessage: string;
}

/**
 * Branch node: Orchestrates multiple rules using logic.
 */
export interface ValidationGroup {
	/**
	 * 'and': All rules must pass.
	 * 'or': At least one rule must pass.
	 * 'not': Negates the first rule in the array.
	 */
	operator: 'and' | 'or' | 'not';

	/**
	 * Can contain more groups (recursion) or specific rules (leaves).
	 */
	rules: Array<ValidationGroup | ValidationRule>;
}

/**
 * The Field Definition: The core blueprint of an input
 */
export interface UISchemaField {
	label: string;
	widget: string; // e.g., 'text', 'select', 'checkbox'
	defaultValue?: LogicValue;
	placeholder?: string;
	description?: string;
	autoSave?: boolean;

	// Transformation Logic
	transform?: TransformKeyword;
	template?: string; // e.g., "{{user.firstName}} {{user.lastName}}"

	// Behavioral Logic
	rules?: FieldRule | FieldRule[];

	validation?: ValidationGroup | ValidationRule;

	// Nested/Array Support
	itemSchema?: Record<string, UISchemaField>;

	// Extra UI configuration
	options?: Array<{ label: string; value: LogicValue }>;
	uiProps?: Record<string, UIPropValue>;
}

/**
 * The Root Schema: The entry point for the engine
 */
export interface UISchema {
	exclude?: string[]; // Keys to strip before final mapping
	fields: Record<string, UISchemaField>;
	settings?: {
		debug?: boolean;
		submitLabel?: string;
	};
}
