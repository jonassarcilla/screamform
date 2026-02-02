import { useState, useMemo, useCallback, useRef } from 'react';
import {
	getFieldState,
	captureInput,
	processSubmission,
	type UISchema,
	type FieldState,
} from '@screamform/core';

type FormDataRecord = Record<string, unknown>;

export function useFormEngine(
	schema: UISchema,
	dataConfig: FormDataRecord = {},
	options?: { isDebug?: boolean },
) {
	// 1. Core States — start with dataConfig so initial load has no "changes"
	const [workingData, setWorkingData] = useState<FormDataRecord>(() => ({
		...dataConfig,
	}));
	const workingDataRef = useRef(workingData);
	workingDataRef.current = workingData;

	const [committedData, setCommittedData] =
		useState<FormDataRecord>(dataConfig);
	const committedDataRef = useRef(committedData);
	committedDataRef.current = committedData;

	const lastSavedDataRef = useRef<FormDataRecord>(
		processSubmission(schema, dataConfig).data || {},
	);
	// Stable initial baseline (same source as workingData) so commits are detected as changes
	const initialBaselineRef = useRef<FormDataRecord>(
		processSubmission(schema, { ...dataConfig }).data || {},
	);

	// Bump after save so hasFormChanges useMemo re-runs
	const [saveVersion, setSaveVersion] = useState(0);

	// 2. Submission & Error States
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitErrors, setSubmitErrors] = useState<Record<
		string,
		string
	> | null>(null);

	// 3. History Management
	const [history, setHistory] = useState<FormDataRecord[]>([dataConfig]);
	const [currentIndex, setCurrentIndex] = useState(0);

	// 4. Form Version
	const [formVersion, setFormVersion] = useState(0);

	// Compare cleaned data to baseline. For autoSave:false fields, use committed value so hasFormChanges is true only after commit.
	const hasFormChanges = useMemo(() => {
		const effectiveData: FormDataRecord = { ...workingData };
		for (const key of Object.keys(schema.fields)) {
			if (schema.fields[key]?.autoSave === false) {
				effectiveData[key] = committedData[key] ?? dataConfig[key] ?? '';
			}
		}
		const currentResult = processSubmission(schema, effectiveData);
		const cleanCurrentData = currentResult.data || {};
		const baseline =
			saveVersion === 0 ? initialBaselineRef.current : lastSavedDataRef.current;

		return Object.keys(schema.fields).some((key) => {
			const base = baseline[key] ?? '';
			const current = cleanCurrentData[key] ?? '';
			return String(base) !== String(current);
		});
	}, [workingData, committedData, dataConfig, schema, saveVersion]);

	const formState = useMemo(() => {
		return getFieldState(schema, workingData, dataConfig, options);
	}, [schema, workingData, dataConfig, options]);

	const isFormDirty = useMemo(() => {
		return Object.keys(schema.fields).some((key) => {
			const fieldSchema = schema.fields[key];
			if (fieldSchema?.autoSave !== false) return false;

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
		[schema.fields, history, currentIndex],
	);

	const submit = useCallback(
		async (onSave: (data: FormDataRecord) => Promise<void>) => {
			setSubmitErrors(null);
			// Use same effectiveData logic as hasFormChanges so baseline matches comparison
			const effectiveData: FormDataRecord = { ...workingDataRef.current };
			for (const key of Object.keys(schema.fields)) {
				if (schema.fields[key]?.autoSave === false) {
					effectiveData[key] =
						committedDataRef.current[key] ?? dataConfig[key] ?? '';
				}
			}
			const result = processSubmission(schema, effectiveData);

			if (!result.success) {
				setSubmitErrors(result.errors);
				return;
			}

			if (!hasFormChanges) {
				if (options?.isDebug) {
					console.log(
						'⏩ No changes since last save. Skipping network request.',
					);
				}
				return;
			}

			try {
				setIsSubmitting(true);
				await onSave(result.data!);

				// ✅ SUCCESS: Baseline = payload we sent (effectiveData) so hasFormChanges becomes false
				lastSavedDataRef.current = { ...result.data };
				setCommittedData({ ...workingDataRef.current });
				setFormVersion((v) => v + 1);
				setSaveVersion((v) => v + 1);
			} catch (err) {
				setSubmitErrors({
					_form: 'Server submission failed. Please try again.',
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[schema, dataConfig, options?.isDebug, hasFormChanges],
	);

	const commit = useCallback(
		(key: string, value?: unknown) => {
			const valueToCommit = value !== undefined ? value : workingData[key];

			setCommittedData((prev) => {
				const next = { ...prev, [key]: valueToCommit };
				const newHistory = history.slice(0, currentIndex + 1);
				setHistory([...newHistory, next]);
				setCurrentIndex(newHistory.length);
				return next;
			});
		},
		[workingData, history, currentIndex],
	);

	const reset = useCallback(() => {
		// 1. Instead of using dataConfig, use the last successfully saved data
		const lastSaved = lastSavedDataRef.current;

		// 2. Wipe active data back to the last SAVE
		setWorkingData({ ...lastSaved });
		setCommittedData({ ...lastSaved });

		// 3. Clear History (since we are jumping to a specific baseline)
		setHistory([{ ...lastSaved }]);
		setCurrentIndex(0);

		// 4. Force UI refresh
		setFormVersion((v) => v + 1);

		// Result: Reset button will now disable after this runs!
	}, [schema]);

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
			};
		}
		return fields;
	}, [formState.fields, committedData, dataConfig, schema.fields]);

	return {
		fields: displayFields,
		isValid: formState.isValid,
		isFormDirty,
		hasFormChanges,
		isSubmitting,
		submitErrors,
		canUndo: !isFormDirty && currentIndex > 0,
		canRedo: !isFormDirty && currentIndex < history.length - 1,
		hasHistoryEntries: history.length > 1,
		undo,
		redo,
		commit,
		onChange,
		submit,
		formVersion,
		reset,
	};
}
