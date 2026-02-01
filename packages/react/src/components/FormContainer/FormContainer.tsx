import { useMemo } from 'react';
import type { UISchema } from '@screamform/core';
import { useFormEngine } from '../../hooks/use-form-engine';
import { FormProvider } from '../../providers/FormContext';
import { FieldRenderer } from '../FieldRenderer';
import { HistoryToolbar } from '@/components/HistoryToolbar/HistoryToolbar';

interface FormContainerProps {
	schema: UISchema;
	// Removed 'any' in favor of 'unknown' for stricter type safety
	dataConfig?: Record<string, unknown>;
	isDebug?: boolean;
}

export function FormContainer({
	schema,
	dataConfig,
	isDebug,
}: FormContainerProps) {
	const engine = useFormEngine(schema, dataConfig, { isDebug });

	// Memoizing contextValue prevents unnecessary re-renders across the field tree
	const contextValue = useMemo(
		() => ({
			onChange: engine.onChange,
			onCommit: engine.commit,
			getField: (key: string) => engine.fields[key],
			undo: engine.undo,
			redo: engine.redo,
			canUndo: engine.canUndo,
			canRedo: engine.canRedo,
			isFormDirty: engine.isFormDirty,
			formVersion: engine.formVersion,
			discardChanges: engine.discardChanges,
		}),
		[
			engine.onChange,
			engine.commit,
			engine.fields,
			engine.undo,
			engine.redo,
			engine.canUndo,
			engine.canRedo,
			engine.isFormDirty,
			engine.formVersion,
			engine.discardChanges,
		],
	);

	return (
		<FormProvider value={contextValue}>
			<div className="max-w-2xl mx-auto p-6 border rounded-xl shadow-lg bg-background">
				{/* 1. Add the Toolbar at the top */}
				<HistoryToolbar />

				{/* 2. Your existing fields */}
				<div className="space-y-4">
					{Object.keys(schema.fields).map((key) => (
						<FieldRenderer key={key} fieldKey={key} />
					))}
				</div>
			</div>
		</FormProvider>
	);
}
