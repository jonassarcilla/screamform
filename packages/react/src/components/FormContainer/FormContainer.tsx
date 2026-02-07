import {
	memo,
	useMemo,
	useState,
	useEffect,
	useRef,
	Profiler,
	type ReactNode,
	type ProfilerOnRenderCallback,
} from 'react';
import { useValue } from '@legendapp/state/react';
import { Check } from 'lucide-react';
import type { UISchema } from '@screamform/core';
import { useFormEngine } from '../../hooks/use-form-engine';
import { FormProvider } from '../../providers/FormContext';
import type { WidgetRegistry } from '../widgets/Registry';
import { useRenderCount } from '@/hooks/use-render-count';
import { FieldRenderer } from '../FieldRenderer';
import { HistoryToolbar } from '@/components/HistoryToolbar/HistoryToolbar';

const FormFields = memo(function FormFields({
	fieldKeys,
}: {
	fieldKeys: readonly string[];
}) {
	return (
		<>
			{fieldKeys.map((key) => (
				<FieldRenderer key={key} fieldKey={key} />
			))}
		</>
	);
});
FormFields.displayName = 'FormFields';

type ProfileSnapshot = {
	id: string;
	phase: string;
	actualDuration: number;
	baseDuration: number;
};

function ProfileFooter({
	profileRef,
	formContainerRenderCount,
}: {
	profileRef: React.RefObject<{
		snapshot: ProfileSnapshot | null;
		notify: () => void;
	}>;
	formContainerRenderCount: number;
}) {
	const [, setTick] = useState(0);
	useEffect(() => {
		const ref = profileRef.current;
		if (!ref) return;
		ref.notify = () => setTick((n) => n + 1);
		return () => {
			ref.notify = () => {};
		};
	}, [profileRef]);
	const snapshot = profileRef.current?.snapshot ?? null;
	return (
		<div
			className="text-xs font-mono text-muted-foreground bg-muted/50 rounded px-3 py-2 border border-dashed space-y-1"
			title="React Profiler + render counts"
		>
			<div>
				<span className="font-medium text-foreground">FormContainer</span>{' '}
				renders: {formContainerRenderCount}
			</div>
			{snapshot && (
				<div>
					<span className="font-medium text-foreground">Profile</span>{' '}
					{snapshot.id} <span className="text-amber-600">{snapshot.phase}</span>{' '}
					— actual: {snapshot.actualDuration.toFixed(2)}ms, base:{' '}
					{snapshot.baseDuration.toFixed(2)}ms
				</div>
			)}
		</div>
	);
}

interface FormContainerProps {
	schema: UISchema;
	dataConfig?: Record<string, unknown>;
	/** Dynamic options for select fields keyed by uiProps.optionsKey (e.g. availableRoles) */
	externalData?: Record<string, Array<{ label: string; value: unknown }>>;
	isDebug?: boolean;
	onSave?: (data: Record<string, unknown>) => Promise<void>;
	/** Optional widget registry: merged with defaults so you can add or override widgets. */
	widgets?: Partial<WidgetRegistry>;
	/** Rendered inside FormProvider (e.g. toolbar that uses useForm().updateFieldSchema) */
	children?: ReactNode;
	/** Called on each commit when profiling (isDebug). Receives id, phase, actualDuration, baseDuration, etc. */
	onProfile?: ProfilerOnRenderCallback;
}

export function FormContainer({
	schema,
	dataConfig,
	externalData,
	isDebug,
	onSave = async (data) => console.log('Default Save (No-op):', data),
	widgets,
	children,
	onProfile,
}: FormContainerProps) {
	const {
		formState$,
		toolbarState$,
		formFieldStates$,
		formVersion$,
		submitErrors$,
		actions,
	} = useFormEngine(schema, dataConfig ?? {}, { isDebug });
	const engineRef = useRef({
		formState$,
		toolbarState$,
		formFieldStates$,
		formVersion$,
		submitErrors$,
	});
	engineRef.current = {
		formState$,
		toolbarState$,
		formFieldStates$,
		formVersion$,
		submitErrors$,
	};
	const [showSuccess, setShowSuccess] = useState(false);
	const formContainerRenderCount = useRenderCount();
	const profileRef = useRef<{
		snapshot: ProfileSnapshot | null;
		notify: () => void;
	}>({ snapshot: null, notify: () => {} });

	// Subscribe to toolbar slice only so typing in one field doesn’t re-render the whole form
	const snapshot = useValue(() => toolbarState$.get());
	const {
		hasFormChanges,
		submitErrors,
		isFormDirty,
		isSubmitting,
		hasHistoryEntries,
	} = snapshot;

	const handleSave = async () => {
		if (!onSave) return;
		await actions.submit(onSave);
		if (!toolbarState$.get().submitErrors) {
			setShowSuccess(true);
		}
	};

	const handleReset = () => {
		const confirmed = window.confirm(
			'Are you sure? This will wipe all changes and clear your undo history.',
		);
		if (confirmed) {
			actions.reset();
		}
	};

	useEffect(() => {
		if (showSuccess) {
			const timer = setTimeout(() => setShowSuccess(false), 2000);
			return () => clearTimeout(timer);
		}
	}, [showSuccess]);

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasFormChanges) {
				e.preventDefault();
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasFormChanges]);

	// When isDebug is true, load React Scan so devs can see re-render highlights (script loads once per document)
	useEffect(() => {
		if (!isDebug || typeof document === 'undefined') return;
		const id = 'react-scan-auto';
		if (document.getElementById(id)) return;
		const script = document.createElement('script');
		script.id = id;
		script.crossOrigin = 'anonymous';
		script.src = 'https://unpkg.com/react-scan@0.4.3/dist/auto.global.js';
		document.head.appendChild(script);
	}, [isDebug]);

	const contextValue = useMemo(
		() => ({
			getEngine: () => engineRef.current,
			actions,
			externalData,
			isDebug: !!isDebug,
			widgets,
		}),
		[actions, externalData, isDebug, widgets],
	);

	const canSave = !!onSave && hasFormChanges && !isFormDirty && !isSubmitting;
	const canReset = !isFormDirty && !isSubmitting && hasHistoryEntries;

	const fieldKeys = useMemo(() => Object.keys(schema.fields), [schema.fields]);

	const handleProfile: ProfilerOnRenderCallback = (
		id,
		phase,
		actualDuration,
		baseDuration,
		startTime,
		commitTime,
	) => {
		if (isDebug) {
			profileRef.current.snapshot = { id, phase, actualDuration, baseDuration };
			queueMicrotask(() => profileRef.current.notify());
		}
		onProfile?.(id, phase, actualDuration, baseDuration, startTime, commitTime);
	};

	const formBody = (
		<>
			<div className="flex items-center justify-between border-b pb-4">
				<h2 className="text-xl font-bold">Form Editor</h2>
				<HistoryToolbar />
			</div>

			{submitErrors?._form && (
				<div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
					{submitErrors._form}
				</div>
			)}

			{children}

			<div className="space-y-4">
				<FormFields fieldKeys={fieldKeys} />
			</div>

			<div className="pt-6 border-t space-y-3">
				<div className="flex items-center justify-end gap-3">
					{isFormDirty && !isSubmitting && (
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
						{isSubmitting ? (
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
		</>
	);

	return (
		<FormProvider value={contextValue}>
			<div className="max-w-2xl mx-auto p-6 border rounded-xl shadow-lg bg-background space-y-6">
				{isDebug ? (
					<Profiler id="FormContainer" onRender={handleProfile}>
						{formBody}
					</Profiler>
				) : (
					formBody
				)}
				{isDebug && (
					<ProfileFooter
						profileRef={profileRef}
						formContainerRenderCount={formContainerRenderCount}
					/>
				)}
			</div>
		</FormProvider>
	);
}

FormContainer.displayName = 'FormContainer';
