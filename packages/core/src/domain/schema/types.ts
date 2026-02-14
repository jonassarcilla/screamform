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

// --- Data Classification & Compliance ---

/**
 * Data sensitivity classification for compliance (SOC 2, HIPAA, GDPR).
 * Sections propagate their classification to children by convention.
 */
export type DataClassification = 'public' | 'internal' | 'confidential' | 'pii';

/**
 * Schema-level metadata for versioning, auditing, and compliance tracking.
 */
export interface SchemaMeta {
	/** Schema version (e.g. '1.0.0'). Useful for SOC 2 audit trails. */
	version?: string;
	/** Unique identifier for this schema definition. */
	id?: string;
	/** Human-readable schema name. */
	name?: string;
	/** Description of the form this schema defines. */
	description?: string;
	/** ISO 8601 timestamp of when the schema was created. */
	createdAt?: string;
	/** ISO 8601 timestamp of the last schema modification. */
	updatedAt?: string;
	/** Author or team that owns this schema. */
	author?: string;
	/** Extensible: custom audit/compliance fields. */
	[key: string]: unknown;
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
	/** Single type or list of allowed types; first is the default for casting/behavior */
	dataType?: PrimitiveType | PrimitiveType[];
	defaultValue?: LogicValue;
	placeholder?: string;
	description?: string;
	autoSave?: boolean;
	bindPath?: string;
	multiple?: boolean;
	/** Data classification for compliance. Sections propagate to children by convention. */
	sensitivity?: DataClassification;

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
		/** Key into external data for dynamic select options (e.g. 'availableRoles'). Used when options are empty or omitted. */
		optionsKey?: string;
		/** When true, single/multi-select shows a search input to filter options by label. */
		searchable?: boolean;
		/** Option values to remove from the list. Compared by String(value). */
		excludeOptions?: LogicValue[];
		/** Option values to show but make non-selectable (disabled). Compared by String(value). */
		disabledOptions?: LogicValue[];
		/** When set, overrides the field's top-level label for display. Allows dynamic updates via updateFieldSchema. */
		label?: string;
		/** When set, overrides the field's top-level placeholder. Allows dynamic updates via updateFieldSchema. */
		placeholder?: string;
		/** When set, overrides the field's top-level description. Allows dynamic updates via updateFieldSchema. */
		description?: string;
		/** For text fields: list of suggestion strings to show (e.g. native datalist / autocomplete). */
		autoSuggestion?: string[];
		[key: string]: UIPropValue;
	};
}

export interface UISchema {
	/** Schema metadata for versioning, auditing, and compliance. */
	meta?: SchemaMeta;
	exclude?: string[];
	fields: Record<string, UISchemaField>;
	settings?: {
		debug?: boolean;
		submitLabel?: string;
	};
}
