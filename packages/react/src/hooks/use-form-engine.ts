import { useState, useMemo, useCallback } from 'react';
import { getFieldState, captureInput, type UISchema } from '@screamform/core';

export function useFormEngine(
	schema: UISchema,
	dataConfig: Record<string, any> = {},
) {
	// The "Dirty" state where active typing lives
	const [workingData, setWorkingData] = useState<Record<string, any>>({});

	// Memoize the form state so we don't re-calculate rules unless data changes
	const formState = useMemo(() => {
		return getFieldState(schema, workingData, dataConfig);
	}, [schema, workingData, dataConfig]);

	const onChange = useCallback(
		(key: string, value: any) => {
			const fieldSchema = schema.fields[key];
			if (!fieldSchema) return;

			// Use Core's captureInput to sanitize the value before saving to state
			const result = captureInput(key, value, workingData[key], fieldSchema);

			setWorkingData((prev) => ({
				...prev,
				[key]: result.value,
			}));
		},
		[schema, workingData],
	);

	return {
		fields: formState.fields,
		isValid: formState.isValid,
		workingData,
		onChange,
		// Future: undo, redo, commit
	};
}
