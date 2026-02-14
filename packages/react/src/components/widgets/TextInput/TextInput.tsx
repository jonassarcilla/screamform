import { useId, useState, useEffect, useRef, useMemo } from 'react';
import { inputBaseClassName } from '@/components/ui/input';
import { FieldWrapper } from '@/components/FieldWrapper';
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import type { WidgetProps } from '../Registry';

export function TextInput({
	fieldKey,
	value,
	label,
	onChange,
	error,
	isRequired,
	isDisabled,
	placeholder,
	autoSave = true,
	description,
	dataType,
	dataTypes,
	uiProps,
	autoSuggestion,
	testId,
	formVersion,
	onCommit,
}: WidgetProps) {
	const id = useId();
	// Renders native <input> so React Scan shows "TextInput.fieldKey" (this component must be direct parent of <input>)
	const FieldInput = useMemo(() => {
		const C = ({ className, ...props }: React.ComponentProps<'input'>) => (
			<input
				data-slot="input"
				className={cn(inputBaseClassName, className)}
				{...props}
			/>
		);
		C.displayName = fieldKey ? `TextInput.${fieldKey}` : 'TextInput';
		return C;
	}, [fieldKey]);

	// Local draft for uncommitted changes
	const [draft, setDraft] = useState<string>(
		value == null ? '' : String(value),
	);
	const [suggestionOpen, setSuggestionOpen] = useState(false);
	const ignoreNextCloseRef = useRef(false);
	const hasSuggestions = Boolean(autoSuggestion?.length);
	const filteredSuggestions =
		hasSuggestions && draft.trim() !== ''
			? (autoSuggestion?.filter((s) =>
					s.toLowerCase().includes(draft.trim().toLowerCase()),
				) ?? [])
			: hasSuggestions
				? (autoSuggestion ?? [])
				: [];
	// Last value we committed; used so isDirty becomes false immediately on commit
	const [lastCommitted, setLastCommitted] = useState<string | null>(null);

	const normalizedValue = value == null ? '' : String(value);
	const prevValueRef = useRef(normalizedValue);

	// Sync draft only when value prop actually changes (e.g. after commit or reset)
	useEffect(() => {
		if (prevValueRef.current !== normalizedValue) {
			prevValueRef.current = normalizedValue;
			setDraft(normalizedValue);
			setLastCommitted(null);
		}
	}, [normalizedValue]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: formVersion acts as a reset trigger; value is read inside but intentionally excluded to avoid re-syncing on every keystroke
	useEffect(() => {
		// When formVersion changes, the global 'Reset' was clicked.
		// We must force the local draft to match the engine's truth.
		const engineValue = value == null ? '' : String(value);
		setDraft(engineValue);

		// Reset the local committed tracker so isDirty recalculates
		setLastCommitted(null);
	}, [formVersion]); // Only trigger on the version bump

	// Dirty = draft differs from authoritative value, and we didn't just commit that draft
	const isDirty =
		draft !== normalizedValue &&
		(lastCommitted === null || draft !== lastCommitted);

	const handleCommit = () => {
		onChange(draft);
		onCommit?.(draft);
		setLastCommitted(draft); // Re-render so isDirty becomes false
	};

	const handleDiscard = (): void => {
		setDraft(normalizedValue);
		setLastCommitted(null);
		// Sync engine so workingData matches committed; enables undo/redo
		onChange(normalizedValue);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVal = e.target.value;
		setDraft(newVal);

		// Only notify the engine if the value is actually different.
		// This prevents "zombie" updates during a discard/reset.
		if (newVal !== normalizedValue) {
			onChange(newVal);
		}
	};

	const handleFocus = () => {
		if (hasSuggestions) {
			ignoreNextCloseRef.current = true;
			setSuggestionOpen(true);
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (!open && ignoreNextCloseRef.current) {
			ignoreNextCloseRef.current = false;
			return;
		}
		setSuggestionOpen(open);
	};

	const handleSelectSuggestion = (item: string) => {
		setDraft(item);
		onChange(item);
		ignoreNextCloseRef.current = false;
		setSuggestionOpen(false);
	};

	const inputEl = (
		<FieldInput
			id={id}
			type="text"
			data-testid={testId}
			value={draft}
			disabled={isDisabled}
			placeholder={placeholder}
			onChange={handleChange}
			onFocus={handleFocus}
			autoComplete={hasSuggestions ? 'off' : undefined}
			className={cn(
				'w-full min-w-0 transition-colors',
				error && 'border-destructive focus-visible:ring-destructive',
			)}
		/>
	);

	return (
		<FieldWrapper
			className={cn(uiProps?.className as string | undefined)}
			label={label ?? ''}
			isRequired={isRequired}
			error={error}
			autoSave={autoSave}
			isDirty={isDirty}
			onCommit={handleCommit}
			onDiscard={handleDiscard}
			description={description}
			isDisabled={isDisabled}
			dataType={dataType}
			dataTypes={dataTypes}
		>
			{hasSuggestions ? (
				<Popover
					open={suggestionOpen}
					onOpenChange={handleOpenChange}
					modal={false}
				>
					<PopoverAnchor asChild>
						<div className="min-w-0 flex-1">{inputEl}</div>
					</PopoverAnchor>
					<PopoverContent
						className="max-h-[200px] w-(--radix-popover-trigger-width) overflow-y-auto p-0"
						align="start"
						sideOffset={4}
						onOpenAutoFocus={(e) => e.preventDefault()}
					>
						{filteredSuggestions.length === 0 ? (
							<div className="px-2 py-3 text-center text-muted-foreground text-sm">
								No suggestions
							</div>
						) : (
							<ul className="py-1">
								{filteredSuggestions.map((item) => (
									<li key={item}>
										<button
											type="button"
											className="w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
											onMouseDown={(e) => {
												e.preventDefault();
												handleSelectSuggestion(item);
											}}
										>
											{item}
										</button>
									</li>
								))}
							</ul>
						)}
					</PopoverContent>
				</Popover>
			) : (
				inputEl
			)}
		</FieldWrapper>
	);
}
TextInput.displayName = 'TextInput';
