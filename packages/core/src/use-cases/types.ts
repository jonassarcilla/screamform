export interface FieldState {
	value: unknown;
	isVisible: boolean;
	isDisabled: boolean;
	error: string | null;
	isRequired: boolean;
	label?: string;
	widget: string;
	placeholder: string;
	description?: string;
	autoSave?: boolean;
	options?: Array<{ label: string; value: unknown }>;
	uiProps?: Record<string, unknown>;
	children?: Record<string, FieldState> | Record<string, FieldState>[];
}

export interface FormState {
	fields: Record<string, FieldState>;
	isValid: boolean;
	data: Record<string, unknown>;
}
