import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { Check } from 'lucide-react'; // Using Lucide for the success icon
import type { UISchema } from '@screamform/core';
import { useFormEngine } from '../../hooks/use-form-engine';
import { FormProvider } from '../../providers/FormContext';
import { FieldRenderer } from '../FieldRenderer';
import { HistoryToolbar } from '@/components/HistoryToolbar/HistoryToolbar';

interface FormContainerProps {
	schema: UISchema;
	dataConfig?: Record<string, unknown>;
	/** Dynamic options for select fields keyed by uiProps.optionsKey (e.g. availableRoles) */
	externalData?: Record<string, Array<{ label: string; value: unknown }>>;
	isDebug?: boolean;
	onSave?: (data: Record<string, unknown>) => Promise<void>;
	/** Rendered inside FormProvider (e.g. toolbar that uses useForm().updateFieldSchema) */
	children?: ReactNode;
}

export function FormContainer({
	schema,
	dataConfig,
	externalData,
	isDebug,
	onSave = async (data) => console.log('Default Save (No-op):', data), // Default handler
	children,
}: FormContainerProps) {
	const engine = useFormEngine(schema, dataConfig, { isDebug });
	const [showSuccess, setShowSuccess] = useState(false);

	const handleSave = async () => {
		if (!onSave) return;
		await engine.submit(onSave);

		// If submission was successful (no errors), show the success state
		if (!engine.submitErrors) {
			setShowSuccess(true);
		}
	};

	const handleReset = () => {
		const confirmed = window.confirm(
			'Are you sure? This will wipe all changes and clear your undo history.',
		);
		if (confirmed) {
			engine.reset();
		}
	};

	// Reset the "Saved!" text back to "Save Changes" after 2 seconds
	useEffect(() => {
		if (showSuccess) {
			const timer = setTimeout(() => setShowSuccess(false), 2000);
			return () => clearTimeout(timer);
		}
	}, [showSuccess]);

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (engine.hasFormChanges) {
				e.preventDefault();
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		// Cleanup the listener when the component unmounts
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [engine.hasFormChanges]);

	const contextValue = useMemo(
		() => ({
			...engine, // Spreading engine for brevity, ensuring hasFormChanges is included
			getField: (key: string) => engine.fields[key],
			onCommit: engine.commit,
			externalData,
		}),
		[engine, externalData],
	);

	// Save enabled when handler exists, there are changes vs last save, and no uncommitted edits
	const canSave =
		!!onSave &&
		engine.hasFormChanges &&
		!engine.isFormDirty &&
		!engine.isSubmitting;

	// Reset enabled when form is not dirty, not submitting, and history has entries
	const canReset =
		!engine.isFormDirty && !engine.isSubmitting && engine.hasHistoryEntries;

	return (
		<FormProvider value={contextValue}>
			<div className="max-w-2xl mx-auto p-6 border rounded-xl shadow-lg bg-background space-y-6">
				<div className="flex items-center justify-between border-b pb-4">
					<h2 className="text-xl font-bold">Form Editor</h2>
					<HistoryToolbar />
				</div>

				{engine.submitErrors?._form && (
					<div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
						{engine.submitErrors._form}
					</div>
				)}

				{children}

				<div className="space-y-4">
					{Object.keys(schema.fields).map((key) => (
						<FieldRenderer key={key} fieldKey={key} />
					))}
				</div>

				<div className="flex items-center justify-end gap-3 pt-6 border-t">
					{engine.isFormDirty && !engine.isSubmitting && (
						<span className="text-xs text-amber-600 font-medium animate-pulse mr-auto">
							Finish editing to unlock save...
						</span>
					)}

					<button
						type="button"
						onClick={handleReset}
						disabled={!canReset}
						className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary disabled:opacity-50"
					>
						Reset
					</button>

					<button
						type="button"
						onClick={handleSave}
						disabled={!canSave}
						className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 min-w-[140px] justify-center
							${
								showSuccess
									? 'bg-green-600 text-white'
									: canSave
										? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
										: 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
							}`}
					>
						{engine.isSubmitting ? (
							<>
								<span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
								Saving...
							</>
						) : showSuccess ? (
							<>
								<Check size={18} />
								Saved!
							</>
						) : (
							'Save Changes'
						)}
					</button>
				</div>
			</div>
		</FormProvider>
	);
}
