import { createContext, useContext, type ReactNode } from 'react';
import { isObservable } from '@legendapp/state';
import { useValue } from '@legendapp/state/react';
import type { FieldState, UISchemaField } from '@screamform/core';
import type {
	FormEngineActions,
	FormStateSnapshot,
	ToolbarSnapshot,
} from '../hooks/use-form-engine';
import {
	DefaultWidgets,
	type WidgetRegistry,
} from '../components/widgets/Registry';

/** Engine observables — kept out of context value so Storybook/DevTools don't call getOwnPropertyDescriptor on them. */
export interface FormEngineRef {
	formState$: { get(): FormStateSnapshot };
	toolbarState$: { get(): ToolbarSnapshot };
	formFieldStates$?: Record<string, { get(): FieldState }> & {
		assign(v: Partial<Record<string, FieldState>>): void;
	};
	formVersion$: { get(): number };
	submitErrors$: { get(): Record<string, string> | null };
}

export interface FormContextValue {
	/** Returns current engine observables (ref-based so context value stays plain for DevTools). */
	getEngine: () => FormEngineRef;
	actions: FormEngineActions;
	externalData?: Record<string, Array<{ label: string; value: unknown }>>;
	/** When true, show render-count badges and profile info for debugging */
	isDebug?: boolean;
	/** Optional widget registry: merged with DefaultWidgets so you can add or override widgets. */
	widgets?: Partial<WidgetRegistry>;
}

const FormContext = createContext<FormContextValue | null>(null);

/** Unwrap any Legend-State observables so React never receives them (avoids Symbol.toPrimitive error). */
function ensurePlainFieldState(
	val: FieldState | undefined,
): FieldState | undefined {
	if (val == null) return val;
	if (isObservable(val)) {
		return ensurePlainFieldState((val as { get(): FieldState }).get()) as
			| FieldState
			| undefined;
	}
	// Recursively unwrap nested observables (e.g. value, options, uiProps)
	const out = { ...val } as FieldState;
	if (isObservable(out.value)) {
		out.value = (out.value as { get(): unknown }).get();
	}
	if (Array.isArray(out.options) && out.options.some(isObservable)) {
		out.options = out.options.map((o: { label: string; value: unknown }) =>
			isObservable(o) ? (o as { get(): unknown }).get() : o,
		) as FieldState['options'];
	}
	if (
		out.uiProps != null &&
		typeof out.uiProps === 'object' &&
		isObservable(out.uiProps)
	) {
		out.uiProps = (out.uiProps as { get(): Record<string, unknown> }).get();
	}
	return out;
}

export function FormProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: FormContextValue;
}) {
	return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormField(fieldKey: string): FieldState | undefined {
	const context = useContext(FormContext);
	if (!context) {
		throw new Error('useFormField must be used within a FormProvider');
	}
	const raw = useValue(() => {
		const { formState$, formFieldStates$ } = context.getEngine();
		if (formFieldStates$ != null && fieldKey in formFieldStates$) {
			const fieldObs = formFieldStates$[fieldKey];
			return fieldObs != null
				? fieldObs.get()
				: formState$.get().fields[fieldKey];
		}
		return formState$.get().fields[fieldKey];
	});
	return ensurePlainFieldState(raw);
}

export function useFormIsDebug(): boolean {
	const context = useContext(FormContext);
	return context?.isDebug ?? false;
}

/** Returns the merged widget registry (DefaultWidgets + context.widgets). Use in FieldRenderer or custom field rendering. */
export function useWidgetRegistry(): WidgetRegistry {
	const context = useContext(FormContext);
	if (!context) {
		return DefaultWidgets;
	}
	const custom = context.widgets;
	if (!custom || Object.keys(custom).length === 0) {
		return DefaultWidgets;
	}
	const merged: WidgetRegistry = { ...DefaultWidgets };
	for (const key of Object.keys(custom)) {
		const comp = custom[key];
		if (comp) merged[key] = comp;
	}
	return merged;
}

export function useFormActions(): FormEngineActions {
	const context = useContext(FormContext);
	if (!context) {
		throw new Error('useFormActions must be used within a FormProvider');
	}
	return context.actions;
}

/** Fine-grained: only re-renders when formVersion or this field's submitError changes. */
export function useFormMetaForField(fieldKey: string): {
	submitError: string | undefined;
	formVersion: number;
	externalData?: Record<string, Array<{ label: string; value: unknown }>>;
} {
	const context = useContext(FormContext);
	if (!context) {
		throw new Error('useFormMetaForField must be used within a FormProvider');
	}
	const formVersion = useValue(() => {
		const { formState$, formVersion$ } = context.getEngine();
		return formVersion$.get();
	});
	const submitError = useValue(() => {
		const { formState$, submitErrors$ } = context.getEngine();
		return (
			submitErrors$.get()?.[fieldKey] ??
			formState$.get().submitErrors?.[fieldKey]
		);
	});
	return {
		submitError,
		formVersion,
		externalData: context.externalData,
	};
}

export function useFormMeta(): {
	submitErrors: Record<string, string> | null;
	formVersion: number;
	canUndo: boolean;
	canRedo: boolean;
	isFormDirty: boolean;
	hasFormChanges: boolean;
	isSubmitting: boolean;
	externalData?: Record<string, Array<{ label: string; value: unknown }>>;
} {
	const context = useContext(FormContext);
	if (!context) {
		throw new Error('useFormMeta must be used within a FormProvider');
	}
	return useValue(() => {
		const snapshot = context.getEngine().formState$.get();
		return {
			...snapshot,
			externalData: context.externalData,
		};
	});
}

/** @deprecated Use useFormField, useFormActions, useFormMeta for fine-grained subscriptions */
export function useForm() {
	const context = useContext(FormContext);
	if (!context) {
		throw new Error('useForm must be used within a FormProvider');
	}
	const snapshot = useValue(() => context.getEngine().formState$.get());
	return {
		...context.actions,
		...snapshot,
		getField: (key: string) => snapshot.fields[key],
		externalData: context.externalData,
	};
}
