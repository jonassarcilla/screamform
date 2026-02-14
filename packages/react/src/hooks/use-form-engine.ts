import { useRef, useEffect, useMemo } from 'react';
import { batch, observable, observe } from '@legendapp/state';
import { useObservable } from '@legendapp/state/react';
import {
	getFieldState,
	captureInput,
	processSubmission,
	type UISchema,
	type UISchemaField,
	type FieldState,
} from '@screamform/core';

type FormDataRecord = Record<string, unknown>;

function shallowEqualFieldState(a: FieldState, b: FieldState): boolean {
	return (
		a.value === b.value &&
		a.isVisible === b.isVisible &&
		a.isDisabled === b.isDisabled &&
		a.error === b.error &&
		a.isRequired === b.isRequired &&
		a.label === b.label &&
		a.widget === b.widget &&
		a.placeholder === b.placeholder &&
		a.autoSave === b.autoSave &&
		a.multiple === b.multiple
	);
}

export interface FormEngineActions {
	onChange: (key: string, value: unknown) => void;
	commit: (key: string, value?: unknown) => void;
	submit: (onSave: (data: FormDataRecord) => Promise<void>) => Promise<void>;
	reset: () => void;
	undo: () => void;
	redo: () => void;
	updateFieldSchema: (
		fieldKey: string,
		updates: Partial<UISchemaField>,
	) => void;
}

export interface FormEngineResult {
	formState$: { get(): FormStateSnapshot };
	/** Toolbar slice for FormContainer; only updates when hasFormChanges/isFormDirty/etc. change (not on every keystroke). */
	toolbarState$: { get(): ToolbarSnapshot };
	/** Per-field observables — each key only notifies when that field changes. Enables fine-grained re-renders. */
	formFieldStates$: Record<string, { get(): FieldState }> & {
		assign(v: Partial<Record<string, FieldState>>): void;
	};
	/** Subscribable formVersion — only changes on reset. Enables fine-grained re-renders. */
	formVersion$: { get(): number };
	/** Subscribable submitErrors — only changes on submit. Enables fine-grained re-renders. */
	submitErrors$: { get(): Record<string, string> | null };
	actions: FormEngineActions;
}

export interface FormStateSnapshot {
	fields: Record<string, FieldState>;
	isValid: boolean;
	isFormDirty: boolean;
	hasFormChanges: boolean;
	submitErrors: Record<string, string> | null;
	formVersion: number;
	isSubmitting: boolean;
	canUndo: boolean;
	canRedo: boolean;
	hasHistoryEntries: boolean;
}

/** Toolbar slice: only these trigger FormContainer re-renders so typing in one field doesn’t re-render the whole form. */
export interface ToolbarSnapshot {
	hasFormChanges: boolean;
	isFormDirty: boolean;
	submitErrors: Record<string, string> | null;
	isSubmitting: boolean;
	hasHistoryEntries: boolean;
}

export function useFormEngine(
	schemaProp: UISchema,
	dataConfig: FormDataRecord = {},
	options?: { isDebug?: boolean },
): FormEngineResult {
	const isDebug = !!options?.isDebug;
	const lastSavedDataRef = useRef<FormDataRecord>(
		(processSubmission(schemaProp, dataConfig).data ?? {}) as FormDataRecord,
	);
	const initialBaselineRef = useRef<FormDataRecord>(
		(processSubmission(schemaProp, { ...dataConfig }).data ??
			{}) as FormDataRecord,
	);
	const lastChangedFieldKeysRef = useRef<Set<string> | null>(null);

	interface FormEngineState {
		schema: UISchema;
		workingData: FormDataRecord;
		committedData: FormDataRecord;
		saveVersion: number;
		formVersion: number;
		isSubmitting: boolean;
		submitErrors: Record<string, string> | null;
		history: FormDataRecord[];
		currentIndex: number;
	}
	const initialState: FormEngineState = {
		schema: schemaProp,
		workingData: { ...dataConfig },
		committedData: { ...dataConfig },
		saveVersion: 0,
		formVersion: 0,
		isSubmitting: false,
		submitErrors: null,
		history: [dataConfig],
		currentIndex: 0,
	};
	/** Typed handle for Legend-State observable; avoids "Type instantiation is excessively deep" from Observable<FormEngineState> */
	interface StateObservable {
		schema: {
			get(): UISchema;
			set(v: UISchema | ((p: UISchema) => UISchema)): void;
		};
		workingData: { get(): FormDataRecord; set(v: FormDataRecord): void };
		committedData: { get(): FormDataRecord; set(v: FormDataRecord): void };
		saveVersion: {
			get(): number;
			set(v: number | ((p: number) => number)): void;
		};
		formVersion: {
			get(): number;
			set(v: number | ((p: number) => number)): void;
		};
		isSubmitting: { get(): boolean; set(v: boolean): void };
		submitErrors: {
			get(): Record<string, string> | null;
			set(v: Record<string, string> | null): void;
		};
		history: { get(): FormDataRecord[]; set(v: FormDataRecord[]): void };
		currentIndex: { get(): number; set(v: number): void };
	}
	// Legend-State's Observable<T> causes "Type instantiation is excessively deep" with FormEngineState
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- required to avoid TS2589
	// @ts-ignore
	const state$ = useObservable(initialState) as StateObservable;

	const initialToolbar: ToolbarSnapshot = {
		hasFormChanges: false,
		isFormDirty: false,
		submitErrors: null,
		isSubmitting: false,
		hasHistoryEntries: false,
	};
	const toolbarState$ = useObservable(initialToolbar);

	useEffect(() => {
		state$.schema.set(schemaProp);
	}, [schemaProp, state$.schema]);

	const formState$ = useMemo(
		() =>
			observable((): FormStateSnapshot => {
				const schema = state$.schema.get();
				const workingData = state$.workingData.get();
				const committedData = state$.committedData.get();
				const saveVersion = state$.saveVersion.get();

				const formState = getFieldState(schema, workingData, dataConfig, {
					isDebug,
				});
				const fields = formState.fields as Record<string, FieldState>;
				const submitErrors = state$.submitErrors.get();
				const displayFields: Record<string, FieldState> = {};
				for (const key of Object.keys(fields)) {
					const base = fields[key];
					if (!base) continue;
					const hasCommitted = key in committedData;
					const finalValue = hasCommitted
						? committedData[key]
						: (dataConfig[key] ?? base.value);
					const submitError = submitErrors?.[key] ?? null;
					displayFields[key] = {
						...base,
						value: finalValue,
						autoSave: schema.fields[key]?.autoSave !== false,
						error: base.error ?? submitError,
					};
				}

				const effectiveData: FormDataRecord = { ...workingData };
				for (const key of Object.keys(schema.fields)) {
					if (schema.fields[key]?.autoSave === false) {
						effectiveData[key] = committedData[key] ?? dataConfig[key] ?? '';
					}
				}
				const currentResult = processSubmission(schema, effectiveData);
				const cleanCurrentData: FormDataRecord = (currentResult.data ??
					{}) as FormDataRecord;
				const baseline =
					saveVersion === 0
						? initialBaselineRef.current
						: lastSavedDataRef.current;

				const hasFormChanges = Object.keys(schema.fields).some((key) => {
					const base = baseline[key] ?? '';
					const current = cleanCurrentData[key] ?? '';
					return String(base) !== String(current);
				});

				const isFormDirty = Object.keys(schema.fields).some((key) => {
					const fieldSchema = schema.fields[key];
					if (fieldSchema?.autoSave !== false) return false;
					const live = workingData[key] ?? dataConfig[key] ?? '';
					const saved = committedData[key] ?? dataConfig[key] ?? '';
					return String(live) !== String(saved);
				});

				const history = state$.history.get();
				const currentIndex = state$.currentIndex.get();

				return {
					fields: displayFields,
					isValid: formState.isValid,
					isFormDirty,
					hasFormChanges,
					submitErrors: state$.submitErrors.get(),
					formVersion: state$.formVersion.get(),
					isSubmitting: state$.isSubmitting.get(),
					canUndo: !isFormDirty && currentIndex > 0,
					canRedo: !isFormDirty && currentIndex < history.length - 1,
					hasHistoryEntries: history.length > 1,
				};
			}),
		[state$, dataConfig, isDebug],
	);

	const formFieldStates$ = useMemo(() => {
		const snapshot = formState$.get();
		return observable({ ...snapshot.fields });
	}, [formState$]);

	useEffect(() => {
		const dispose = observe(() => {
			const snapshot = formState$.get();
			const fields = snapshot.fields;
			const keys = lastChangedFieldKeysRef.current;
			const updates: Partial<Record<string, FieldState>> = {};
			const formFieldStates = formFieldStates$ as Record<
				string,
				{ get(): FieldState }
			> & {
				assign(v: Partial<Record<string, FieldState>>): void;
			};

			if (keys && keys.size > 0) {
				for (const key of keys) {
					const next = fields[key];
					if (!next) continue;
					const prev = formFieldStates[key]?.get?.();
					if (prev === undefined || !shallowEqualFieldState(prev, next)) {
						updates[key] = next;
					}
				}
				lastChangedFieldKeysRef.current = null;
			} else {
				for (const key of Object.keys(fields)) {
					const next = fields[key];
					if (!next) continue;
					const prev = formFieldStates[key]?.get?.();
					if (prev === undefined || !shallowEqualFieldState(prev, next)) {
						updates[key] = next;
					}
				}
			}

			if (Object.keys(updates).length > 0) {
				formFieldStates.assign(updates);
			}

			// Sync toolbar slice only when it actually changes so FormContainer doesn’t re-render on every keystroke
			const nextToolbar: ToolbarSnapshot = {
				hasFormChanges: snapshot.hasFormChanges,
				isFormDirty: snapshot.isFormDirty,
				submitErrors: snapshot.submitErrors,
				isSubmitting: snapshot.isSubmitting,
				hasHistoryEntries: snapshot.hasHistoryEntries,
			};
			const prevToolbar = toolbarState$.get();
			if (
				prevToolbar.hasFormChanges !== nextToolbar.hasFormChanges ||
				prevToolbar.isFormDirty !== nextToolbar.isFormDirty ||
				prevToolbar.submitErrors !== nextToolbar.submitErrors ||
				prevToolbar.isSubmitting !== nextToolbar.isSubmitting ||
				prevToolbar.hasHistoryEntries !== nextToolbar.hasHistoryEntries
			) {
				toolbarState$.set(nextToolbar);
			}
		});
		return dispose;
	}, [formState$, formFieldStates$, toolbarState$]);

	const actionsRef = useRef<FormEngineActions | null>(null);
	if (!actionsRef.current) {
		actionsRef.current = {
			onChange: (key: string, value: unknown) => {
				const schema = state$.schema.get();
				const fieldSchema = schema.fields[key];
				if (!fieldSchema) return;

				if (!lastChangedFieldKeysRef.current) {
					lastChangedFieldKeysRef.current = new Set();
				}
				lastChangedFieldKeysRef.current.add(key);

				const prev = state$.workingData.get();
				const result = captureInput(key, value, prev[key], fieldSchema);
				const newValue = result.value;

				// Batch all observable writes so formState$ recomputes only once
				// with both workingData AND committedData in their final state.
				// Without batch, committedData.set() triggers a recomputation
				// where workingData still holds the stale value, producing a
				// transient (but visible) validation error.
				batch(() => {
					if (fieldSchema.autoSave !== false) {
						const history = state$.history.get();
						const currentIndex = state$.currentIndex.get();
						const prevCommit = state$.committedData.get();
						const nextCommit = { ...prevCommit, [key]: newValue };
						const newHistory = history.slice(0, currentIndex + 1);
						const updatedHistory = [...newHistory, nextCommit];
						state$.committedData.set(nextCommit);
						state$.history.set(updatedHistory);
						state$.currentIndex.set(updatedHistory.length - 1);
					}
					state$.workingData.set({ ...prev, [key]: newValue });

					// Clear this field's submit error when user edits so live validation can show
					const currentSubmitErrors = state$.submitErrors.get();
					if (currentSubmitErrors?.[key]) {
						const next = { ...currentSubmitErrors };
						delete next[key];
						state$.submitErrors.set(Object.keys(next).length > 0 ? next : null);
					}
				});
			},

			commit: (key: string, value?: unknown) => {
				if (!lastChangedFieldKeysRef.current) {
					lastChangedFieldKeysRef.current = new Set();
				}
				lastChangedFieldKeysRef.current.add(key);

				const workingData = state$.workingData.get();
				const valueToCommit = value !== undefined ? value : workingData[key];
				const prev = state$.committedData.get();
				const history = state$.history.get();
				const currentIndex = state$.currentIndex.get();
				const next = { ...prev, [key]: valueToCommit };
				const newHistory = [...history.slice(0, currentIndex + 1), next];
				batch(() => {
					state$.committedData.set(next);
					state$.history.set(newHistory);
					state$.currentIndex.set(newHistory.length);
				});
			},

			submit: async (onSave: (data: FormDataRecord) => Promise<void>) => {
				lastChangedFieldKeysRef.current = null;
				state$.submitErrors.set(null);
				const schema = state$.schema.get();
				const workingData = state$.workingData.get();
				const committedData = state$.committedData.get();

				const effectiveData: FormDataRecord = { ...workingData };
				for (const key of Object.keys(schema.fields)) {
					if (schema.fields[key]?.autoSave === false) {
						effectiveData[key] = committedData[key] ?? dataConfig[key] ?? '';
					}
				}
				const result = processSubmission(schema, effectiveData);

				if (!result.success) {
					state$.submitErrors.set(
						result.errors as Record<string, string> | null,
					);
					return;
				}

				const hasFormChanges = formState$.get().hasFormChanges;
				if (!hasFormChanges) {
					if (options?.isDebug) {
						console.info(
							'⏩ No changes since last save. Skipping network request.',
						);
					}
					return;
				}

				try {
					state$.isSubmitting.set(true);
					await onSave((result.data ?? {}) as FormDataRecord);
					lastSavedDataRef.current = { ...result.data };
					state$.committedData.set({ ...workingData });
					state$.formVersion.set((v) => v + 1);
					state$.saveVersion.set((v) => v + 1);
				} catch {
					state$.submitErrors.set({
						_form: 'Server submission failed. Please try again.',
					});
				} finally {
					state$.isSubmitting.set(false);
				}
			},

			reset: () => {
				lastChangedFieldKeysRef.current = null;
				const lastSaved = lastSavedDataRef.current;
				state$.workingData.set({ ...lastSaved });
				state$.committedData.set({ ...lastSaved });
				state$.history.set([{ ...lastSaved }]);
				state$.currentIndex.set(0);
				state$.formVersion.set((v) => v + 1);
			},

			updateFieldSchema: (
				fieldKey: string,
				updates: Partial<UISchemaField>,
			) => {
				if (!lastChangedFieldKeysRef.current) {
					lastChangedFieldKeysRef.current = new Set();
				}
				lastChangedFieldKeysRef.current.add(fieldKey);

				state$.schema.set((prev: UISchema) => {
					const currentField = prev.fields[fieldKey];
					if (!currentField) return prev;
					const nextField: UISchemaField = {
						...currentField,
						...updates,
					};
					if (updates.uiProps !== undefined) {
						nextField.uiProps = {
							...currentField?.uiProps,
							...updates.uiProps,
						};
					}
					return {
						...prev,
						fields: {
							...prev.fields,
							[fieldKey]: nextField,
						},
					};
				});
			},

			undo: () => {
				const snapshot = formState$.get();
				if (snapshot.isFormDirty) return;
				lastChangedFieldKeysRef.current = null;
				const history = state$.history.get();
				const currentIndex = state$.currentIndex.get();
				if (currentIndex <= 0) return;
				const previousState = history[currentIndex - 1];
				if (previousState === undefined) return;
				state$.currentIndex.set(currentIndex - 1);
				state$.committedData.set(previousState);
				state$.workingData.set(previousState);
			},

			redo: () => {
				const snapshot = formState$.get();
				if (snapshot.isFormDirty) return;
				lastChangedFieldKeysRef.current = null;
				const history = state$.history.get();
				const currentIndex = state$.currentIndex.get();
				if (currentIndex >= history.length - 1) return;
				const nextState = history[currentIndex + 1];
				if (nextState === undefined) return;
				state$.currentIndex.set(currentIndex + 1);
				state$.committedData.set(nextState);
				state$.workingData.set(nextState);
			},
		};
	}

	return {
		formState$,
		toolbarState$,
		formFieldStates$,
		formVersion$: state$.formVersion,
		submitErrors$: state$.submitErrors,
		actions: actionsRef.current,
	};
}
