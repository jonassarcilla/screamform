import { createContext, useContext, type ReactNode } from 'react';
import type { FieldState, UISchemaField } from '@screamform/core';

interface FormContextType {
	// Core Actions
	onChange: (key: string, value: unknown) => void;
	onCommit: (key: string, value?: unknown) => void;
	getField: (key: string) => FieldState | undefined;

	// NEW: Submission Actions
	submit: (
		onSave: (data: Record<string, unknown>) => Promise<void>,
	) => Promise<void>;

	formVersion: number;
	reset: () => void;

	// History Actions
	undo: () => void;
	redo: () => void;

	// History State Flags
	canUndo: boolean;
	canRedo: boolean;
	isFormDirty: boolean;

	// NEW: Submission State Flags
	isSubmitting: boolean;
	submitErrors: Record<string, string> | null;

	/** Dynamic options for select fields keyed by uiProps.optionsKey (e.g. availableRoles) */
	externalData?: Record<string, Array<{ label: string; value: unknown }>>;

	/** Update a field's schema (e.g. uiProps). Merges uiProps when provided. */
	updateFieldSchema?: (
		fieldKey: string,
		updates: Partial<UISchemaField>,
	) => void;
}

const FormContext = createContext<FormContextType | null>(null);

export function FormProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: FormContextType;
}) {
	return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export const useForm = () => {
	const context = useContext(FormContext);
	if (!context) {
		throw new Error('useForm must be used within a FormProvider');
	}
	return context;
};
