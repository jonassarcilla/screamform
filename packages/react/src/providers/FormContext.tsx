import { createContext, useContext, type ReactNode } from 'react';
import type { FieldState } from '@screamform/core';

interface FormContextType {
	// Core Actions
	onChange: (key: string, value: unknown) => void;
	onCommit: (key: string, value?: unknown) => void;
	getField: (key: string) => FieldState | undefined;

	formVersion: number; // Add this
	discardChanges: () => void; // Add this

	// History Actions
	undo: () => void;
	redo: () => void;

	// History State Flags
	canUndo: boolean;
	canRedo: boolean;
	isFormDirty: boolean;
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
