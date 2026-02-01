import { useState, useMemo, useCallback, useRef } from 'react';
import {
	getFieldState,
	captureInput,
	type UISchema,
	type FieldState,
} from '@screamform/core';

type FormDataRecord = Record<string, unknown>;

export function useFormEngine(
	schema: UISchema,
	dataConfig: FormDataRecord = {},
	options?: { isDebug?: boolean },
) {
	// 1. Core States
	const [workingData, setWorkingData] = useState<FormDataRecord>({});
	const [committedData, setCommittedData] =
		useState<FormDataRecord>(dataConfig);
	const committedDataRef = useRef(committedData);
	committedDataRef.current = committedData;

	// 2. History Management
	// We store snapshots of committedData in a stack
	const [history, setHistory] = useState<FormDataRecord[]>([dataConfig]);
	const [currentIndex, setCurrentIndex] = useState(0);

	// 3. Form Version (for dirty detection)
	const [formVersion, setFormVersion] = useState(0);

	const formState = useMemo(() => {
		return getFieldState(schema, workingData, dataConfig, options);
	}, [schema, workingData, dataConfig, options]);

	// Derived State: Is the form currently being edited?
	// Inside use-form-engine.ts
	const isFormDirty = useMemo(() => {
		return Object.keys(schema.fields).some((key) => {
			const fieldSchema = schema.fields[key];
			if (fieldSchema?.autoSave !== false) return false;

			// Use the same fallbacks as your console.table
			const live = workingData[key] ?? dataConfig[key] ?? '';
			const saved = committedData[key] ?? dataConfig[key] ?? '';

			return String(live) !== String(saved);
		});
	}, [workingData, committedData, schema.fields, dataConfig]);

	const onChange = useCallback(
		(key: string, value: unknown) => {
			const fieldSchema = schema.fields[key];
			if (!fieldSchema) return;

			setWorkingData((prev) => {
				const result = captureInput(key, value, prev[key], fieldSchema);
				const newValue = result.value;

				// Only update committed if autoSave is true
				if (fieldSchema.autoSave !== false) {
					setCommittedData((prevCommit) => {
						const nextCommit = { ...prevCommit, [key]: newValue };
						const newHistory = history.slice(0, currentIndex + 1);
						const updatedHistory = [...newHistory, nextCommit];
						setHistory(updatedHistory);
						setCurrentIndex(updatedHistory.length - 1);
						return nextCommit;
					});
				}
				return { ...prev, [key]: newValue };
			});
		},
		[schema.fields, history, currentIndex], // workingData is removed from here
	);

	const commit = useCallback(
		(key: string, value?: unknown) => {
			const valueToCommit = value !== undefined ? value : workingData[key];

			setCommittedData((prev) => {
				const next = { ...prev, [key]: valueToCommit };

				// Push new snapshot to history and clear any "future" redo path
				const newHistory = history.slice(0, currentIndex + 1);
				setHistory([...newHistory, next]);
				setCurrentIndex(newHistory.length);

				return next;
			});
		},
		[workingData, history, currentIndex],
	);

	const discardChanges = useCallback(() => {
		// Always use latest committed state (avoids stale closure)
		const latest = committedDataRef.current;
		setWorkingData({ ...latest });
		setFormVersion((v) => v + 1);
	}, []);

	// 3. Undo/Redo Actions (Blocked if isFormDirty is true)
	const undo = useCallback(() => {
		if (isFormDirty || currentIndex <= 0) return;

		const previousState = history[currentIndex - 1];
		if (previousState === undefined) return;
		setCurrentIndex(currentIndex - 1);
		setCommittedData(previousState);
		setWorkingData(previousState);
	}, [currentIndex, history, isFormDirty]);

	const redo = useCallback(() => {
		if (isFormDirty || currentIndex >= history.length - 1) return;

		const nextState = history[currentIndex + 1];
		if (nextState === undefined) return;
		setCurrentIndex(currentIndex + 1);
		setCommittedData(nextState);
		setWorkingData(nextState);
	}, [currentIndex, history, isFormDirty]);

	const displayFields = useMemo(() => {
		const fields: Record<string, FieldState> = { ...formState.fields };

		for (const key in fields) {
			const base = fields[key];
			if (!base) continue;

			const hasCommitted = key in committedData;
			const finalValue = hasCommitted
				? committedData[key]
				: (dataConfig[key] ?? '');

			fields[key] = {
				...base,
				value: finalValue,
				autoSave: schema.fields[key]?.autoSave !== false,
				isVisible: base.isVisible,
				isDisabled: base.isDisabled,
				isRequired: base.isRequired,
				error: base.error,
				widget: base.widget ?? 'text',
				placeholder: base.placeholder ?? '',
			};
		}
		return fields;
	}, [formState.fields, committedData, dataConfig, schema.fields]);

	if (options?.isDebug) {
		console.table(
			Object.keys(schema.fields).map((key) => ({
				field: key,
				working: workingData[key],
				committed: committedData[key],
				isDirty:
					String(workingData[key] ?? dataConfig[key] ?? '') !==
					String(committedData[key] ?? dataConfig[key] ?? ''),
			})),
		);
	}

	return {
		fields: displayFields,
		isValid: formState.isValid,
		isFormDirty,
		canUndo: !isFormDirty && currentIndex > 0,
		canRedo: !isFormDirty && currentIndex < history.length - 1,
		undo,
		redo,
		commit,
		onChange,
		formVersion,
		discardChanges,
	};
}
