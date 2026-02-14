import { FieldWrapper } from '@/components/FieldWrapper';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { inputBaseClassName } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	selectTriggerClassName,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { LogicValue } from '@screamform/core';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { WidgetProps } from '../Registry';

/** Single-select only: when options are empty and required, inject this option and use as default */
const EMPTY_REQUIRED_OPTION = { label: 'None', value: 'none' } as const;

export function SelectInput({
	fieldKey,
	value,
	label,
	onChange,
	onCommit,
	error,
	isRequired,
	isDisabled,
	placeholder = 'Select...',
	autoSave = true,
	description,
	options = [],
	multiple,
	maxItems,
	dataType,
	dataTypes,
	searchable = false,
	disabledOptions = [],
	formVersion,
}: WidgetProps) {
	const [multiOpen, setMultiOpen] = useState(false);
	const multiRef = useRef<HTMLDivElement>(null);
	const [multiSearchQuery, setMultiSearchQuery] = useState('');
	const [singleComboboxOpen, setSingleComboboxOpen] = useState(false);

	const disabledSet = useMemo(
		() => new Set((disabledOptions ?? []).map((v) => String(v))),
		[disabledOptions],
	);

	// Renders native <input> so React Scan shows "SelectInput.fieldKey.Search" (must be direct parent of <input>)
	const FieldSearchInput = useMemo(() => {
		const C = ({ className, ...props }: React.ComponentProps<'input'>) => (
			<input
				data-slot="input"
				className={cn(inputBaseClassName, className)}
				{...props}
			/>
		);
		C.displayName = fieldKey ? `SelectInput.${fieldKey}` : 'SelectInput';
		return C;
	}, [fieldKey]);

	// Native <button> wrappers so React Scan shows "SelectInput.fieldKey" instead of Primitive.Button
	const SelectInputSingleTrigger = useMemo(() => {
		const C = React.forwardRef<
			HTMLButtonElement,
			React.ComponentProps<'button'> & { children?: React.ReactNode }
		>(({ className, children, ...props }, ref) => (
			<button
				type="button"
				ref={ref}
				data-slot="select-trigger"
				data-size="default"
				className={cn(selectTriggerClassName, 'w-full', className)}
				{...props}
			>
				{children}
				<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
			</button>
		));
		C.displayName = fieldKey ? `SelectInput.${fieldKey}` : 'SelectInput';
		return C;
	}, [fieldKey]);

	const SelectInputMultiTrigger = useMemo(() => {
		const C = ({
			className,
			children,
			...props
		}: React.ComponentProps<'button'>) => (
			<button
				type="button"
				className={cn(
					buttonVariants({ variant: 'outline' }),
					'h-auto min-h-10 w-full justify-between text-left font-normal',
					className,
				)}
				{...props}
			>
				{children}
			</button>
		);
		C.displayName = fieldKey ? `SelectInput.${fieldKey}` : 'SelectInput';
		return C;
	}, [fieldKey]);

	const SelectInputComboboxTrigger = useMemo(() => {
		const C = React.forwardRef<
			HTMLButtonElement,
			React.ComponentProps<'button'> & { children?: React.ReactNode }
		>(({ className, children, ...props }, ref) => (
			<button
				type="button"
				ref={ref}
				className={cn(
					buttonVariants({ variant: 'outline' }),
					'w-full justify-between font-normal',
					className,
				)}
				{...props}
			>
				{children}
			</button>
		));
		C.displayName = fieldKey ? `SelectInput.${fieldKey}` : 'SelectInput';
		return C;
	}, [fieldKey]);

	// Draft state for autoSave: false (single: string, multi: unknown[])
	const [draftSingle, setDraftSingle] = useState<string>(() =>
		value == null ? '' : String(value),
	);
	const [draftMulti, setDraftMulti] = useState<unknown[]>(() =>
		Array.isArray(value) ? [...value] : [],
	);
	const [lastCommitted, setLastCommitted] = useState<string | null>(null);

	useEffect(() => {
		if (!multiOpen) return;
		const close = (e: MouseEvent) => {
			if (multiRef.current && !multiRef.current.contains(e.target as Node)) {
				setMultiOpen(false);
			}
		};
		document.addEventListener('mousedown', close);
		return () => document.removeEventListener('mousedown', close);
	}, [multiOpen]);

	useEffect(() => {
		if (!multiOpen) setMultiSearchQuery('');
	}, [multiOpen]);

	const normalizedSingle = value == null ? '' : String(value);
	const normalizedMulti = Array.isArray(value) ? [...value] : [];
	const prevSingleRef = useRef(normalizedSingle);
	const prevMultiRef = useRef(JSON.stringify(normalizedMulti));

	useEffect(() => {
		if (multiple) {
			const next = JSON.stringify(normalizedMulti);
			if (prevMultiRef.current !== next) {
				prevMultiRef.current = next;
				setDraftMulti(normalizedMulti);
				setLastCommitted(null);
			}
		} else {
			if (prevSingleRef.current !== normalizedSingle) {
				prevSingleRef.current = normalizedSingle;
				setDraftSingle(normalizedSingle);
				setLastCommitted(null);
			}
		}
	}, [multiple, normalizedSingle, normalizedMulti]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: formVersion acts as a reset trigger; value and multiple are read inside but intentionally excluded to avoid re-syncing on every change
	useEffect(() => {
		// When formVersion changes, the global 'Reset' was clicked.
		const engineValue = value;
		if (multiple) {
			const arr = Array.isArray(engineValue) ? [...engineValue] : [];
			setDraftMulti(arr);
			prevMultiRef.current = JSON.stringify(arr);
		} else {
			const s = engineValue == null ? '' : String(engineValue);
			setDraftSingle(s);
			prevSingleRef.current = s;
		}
		setLastCommitted(null);
	}, [formVersion]);

	// Single-select only: when options are empty and required, default value to 'none' so validation passes
	useEffect(() => {
		if (
			multiple ||
			(options ?? []).length > 0 ||
			!isRequired ||
			(value != null && value !== '')
		)
			return;
		onChange('none' as LogicValue);
	}, [multiple, options, isRequired, value, onChange]);

	const isDirtySingle =
		!autoSave &&
		draftSingle !== normalizedSingle &&
		(lastCommitted === null || draftSingle !== lastCommitted);
	const isDirtyMulti =
		!autoSave &&
		JSON.stringify(draftMulti) !== JSON.stringify(normalizedMulti) &&
		(lastCommitted === null || JSON.stringify(draftMulti) !== lastCommitted);

	const handleCommitSingle = () => {
		const final = castValue(draftSingle);
		onChange(final);
		onCommit?.(final);
		setLastCommitted(draftSingle);
	};
	const handleDiscardSingle = () => {
		setDraftSingle(normalizedSingle);
		setLastCommitted(null);
		onChange(castValue(normalizedSingle));
	};
	const handleCommitMulti = () => {
		const casted = draftMulti.map(castValue);
		onChange(casted);
		onCommit?.(casted);
		setLastCommitted(JSON.stringify(draftMulti));
	};
	const handleDiscardMulti = () => {
		setDraftMulti(normalizedMulti);
		setLastCommitted(null);
		onChange(normalizedMulti.length ? normalizedMulti : ([] as LogicValue));
	};

	const castValue = (val: unknown): LogicValue => {
		if (val === '' || val === null || val === undefined)
			return null as LogicValue;
		if (dataType === 'number') return Number(val) as LogicValue;
		if (dataType === 'boolean')
			return (val === 'true' || val === true) as LogicValue;
		return String(val) as LogicValue;
	};

	const safeValue = useMemo(() => {
		if (multiple) return Array.isArray(value) ? value : [];
		return value ?? '';
	}, [value, multiple]);

	const handleToggleMultiple = (itemValue: unknown) => {
		const currentItems = autoSave
			? Array.isArray(safeValue)
				? [...safeValue]
				: []
			: [...draftMulti];
		const isSelected = currentItems.some(
			(v) => String(v) === String(itemValue),
		);

		let nextItems: unknown[];
		if (isSelected) {
			nextItems = currentItems.filter((v) => String(v) !== String(itemValue));
		} else {
			if (maxItems && currentItems.length >= maxItems) return;
			nextItems = [...currentItems, itemValue];
		}

		if (autoSave) {
			const castedItems = nextItems.map(castValue);
			onChange(castedItems);
			onCommit?.(castedItems);
		} else {
			setDraftMulti(nextItems);
			onChange(nextItems.map(castValue));
		}
	};

	// --- RENDER MULTIPLE MODE (inline dropdown, no Popover/Command) ---
	if (multiple) {
		const multiValues = autoSave
			? Array.isArray(safeValue)
				? safeValue
				: []
			: draftMulti;
		const optionList = options ?? [];
		const query = searchable ? multiSearchQuery.trim().toLowerCase() : '';
		const filteredOptions =
			searchable && query
				? optionList.filter(
						(opt: { label: string; value: unknown }) =>
							opt.label.toLowerCase().includes(query) ||
							String(opt.value).toLowerCase().includes(query),
					)
				: optionList;
		const multiLabel =
			maxItems != null ? `${label} (${multiValues.length}/${maxItems})` : label;

		return (
			<FieldWrapper
				label={multiLabel ?? ''}
				isRequired={isRequired}
				error={error}
				autoSave={autoSave}
				isDirty={isDirtyMulti}
				onCommit={handleCommitMulti}
				onDiscard={handleDiscardMulti}
				description={description}
				isDisabled={isDisabled}
				dataType={dataType}
				dataTypes={dataTypes}
			>
				<div ref={multiRef} className="relative min-w-0 flex-1">
					<SelectInputMultiTrigger
						disabled={isDisabled}
						className={cn(error && 'border-destructive')}
						onClick={() => setMultiOpen((o) => !o)}
						aria-expanded={multiOpen}
						aria-haspopup="listbox"
					>
						<div className="flex min-w-0 flex-1 flex-wrap gap-1">
							{multiValues.length > 0 ? (
								multiValues.map((v) => (
									<Badge
										key={String(v)}
										variant="secondary"
										className="flex items-center gap-1 [&>span]:pointer-events-auto"
									>
										{optionList.find(
											(o: { label: string; value: unknown }) =>
												String(o.value) === String(v),
										)?.label ?? String(v)}
										<span
											role="button"
											tabIndex={0}
											className="ml-0.5 inline-flex cursor-pointer rounded p-0.5 hover:bg-muted hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												handleToggleMultiple(v);
											}}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													e.stopPropagation();
													handleToggleMultiple(v);
												}
											}}
											aria-label={`Remove ${optionList.find((o: { label: string; value: unknown }) => String(o.value) === String(v))?.label ?? v}`}
										>
											<X className="pointer-events-none h-3 w-3" aria-hidden />
										</span>
									</Badge>
								))
							) : (
								<span className="text-muted-foreground">{placeholder}</span>
							)}
						</div>
						<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
					</SelectInputMultiTrigger>
					{multiOpen && (
						<div
							className="absolute top-full right-0 left-0 z-50 mt-1 flex max-h-[300px] flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
							role="listbox"
							tabIndex={-1}
						>
							{searchable && (
								<div className="border-b p-1">
									<FieldSearchInput
										type="text"
										placeholder="Search..."
										value={multiSearchQuery}
										onChange={(e) => setMultiSearchQuery(e.target.value)}
										onKeyDown={(e) => e.stopPropagation()}
										className="h-8"
										aria-label="Filter options"
									/>
								</div>
							)}
							<div className="flex-1 overflow-y-auto p-1">
								{optionList.length === 0 ? (
									<div className="py-4 text-center text-muted-foreground text-sm">
										No options
									</div>
								) : filteredOptions.length === 0 ? (
									<div className="py-4 text-center text-muted-foreground text-sm">
										No results
									</div>
								) : (
									filteredOptions.map(
										(opt: { label: string; value: unknown }) => {
											const isSelected = multiValues.some(
												(v) => String(v) === String(opt.value),
											);
											const isDisabled = disabledSet.has(String(opt.value));
											return (
												<button
													key={String(opt.value)}
													type="button"
													role="option"
													aria-selected={isSelected}
													aria-disabled={isDisabled}
													disabled={isDisabled}
													className={cn(
														'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
														isSelected && 'bg-accent',
														isDisabled &&
															'pointer-events-none cursor-not-allowed opacity-50',
													)}
													onClick={() =>
														!isDisabled && handleToggleMultiple(opt.value)
													}
												>
													<div
														className={cn(
															'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
															isSelected
																? 'bg-primary text-primary-foreground'
																: 'opacity-50',
														)}
													>
														{isSelected && <Check className="h-3 w-3" />}
													</div>
													{opt.label}
												</button>
											);
										},
									)
								)}
							</div>
						</div>
					)}
				</div>
			</FieldWrapper>
		);
	}

	// --- RENDER SINGLE MODE ---
	// When options are empty and required, show "None" option and default to "none" (single-select only)
	const singleSelectOptions =
		(options ?? []).length === 0 && isRequired
			? [EMPTY_REQUIRED_OPTION]
			: (options ?? []);

	const singleDisplayValueRaw = autoSave
		? safeValue
			? String(safeValue)
			: undefined
		: draftSingle || undefined;
	// When we injected "None" and there is no value, treat as "none" so required validation passes
	const singleDisplayValue =
		singleSelectOptions.length === 1 &&
		singleSelectOptions[0]?.value === 'none' &&
		(singleDisplayValueRaw === undefined ||
			singleDisplayValueRaw === null ||
			singleDisplayValueRaw === '')
			? 'none'
			: (singleDisplayValueRaw ?? undefined);

	const singleDisplayLabel =
		singleDisplayValue != null && singleDisplayValue !== ''
			? (singleSelectOptions.find(
					(o: { label: string; value: unknown }) =>
						String(o.value) === String(singleDisplayValue),
				)?.label ?? String(singleDisplayValue))
			: null;

	// Single-select with search: Combobox (Popover + Command)
	if (searchable) {
		return (
			<FieldWrapper
				label={label ?? ''}
				isRequired={isRequired}
				error={error}
				autoSave={autoSave}
				isDirty={isDirtySingle}
				onCommit={handleCommitSingle}
				onDiscard={handleDiscardSingle}
				description={description}
				isDisabled={isDisabled}
				dataType={dataType}
				dataTypes={dataTypes}
			>
				<div className="relative min-w-0 flex-1">
					<Popover
						open={singleComboboxOpen}
						onOpenChange={setSingleComboboxOpen}
					>
						<PopoverTrigger asChild>
							<SelectInputComboboxTrigger
								disabled={isDisabled}
								className={cn(error && 'border-destructive')}
								aria-expanded={singleComboboxOpen}
								aria-haspopup="listbox"
							>
								<span
									className={
										singleDisplayLabel ? 'truncate' : 'text-muted-foreground'
									}
								>
									{singleDisplayLabel ?? placeholder}
								</span>
								<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
							</SelectInputComboboxTrigger>
						</PopoverTrigger>
						<PopoverContent
							className="w-(--radix-popover-trigger-width) p-0"
							align="start"
							sideOffset={0}
						>
							<Command>
								<CommandInput
									placeholder="Search..."
									aria-label="Search options"
								/>
								<CommandList>
									<CommandEmpty>No results.</CommandEmpty>
									{singleSelectOptions.map(
										(opt: { label: string; value: unknown }) => {
											const isDisabled = disabledSet.has(String(opt.value));
											return (
												<CommandItem
													key={String(opt.value)}
													value={`${opt.label} ${String(opt.value)}`}
													disabled={isDisabled}
													onSelect={() => {
														if (isDisabled) return;
														const final = castValue(opt.value);
														if (autoSave) {
															onChange(final);
															onCommit?.(final);
														} else {
															setDraftSingle(String(opt.value));
															onChange(final);
														}
														setSingleComboboxOpen(false);
													}}
												>
													{opt.label}
												</CommandItem>
											);
										},
									)}
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
			</FieldWrapper>
		);
	}

	// Single-select without search: Radix Select
	return (
		<FieldWrapper
			label={label ?? ''}
			isRequired={isRequired}
			error={error}
			autoSave={autoSave}
			isDirty={isDirtySingle}
			onCommit={handleCommitSingle}
			onDiscard={handleDiscardSingle}
			description={description}
			isDisabled={isDisabled}
			dataType={dataType}
			dataTypes={dataTypes}
		>
			<div className="relative min-w-0 flex-1">
				<Select
					value={singleDisplayValue}
					onValueChange={(val) => {
						const final = castValue(val);
						if (autoSave) {
							onChange(final);
							onCommit?.(final);
						} else {
							setDraftSingle(val);
							onChange(final);
						}
					}}
					disabled={isDisabled}
				>
					<SelectTrigger asChild>
						<SelectInputSingleTrigger
							className={cn(
								'pointer-events-auto w-full',
								error && 'border-destructive',
							)}
						>
							<SelectValue placeholder={placeholder} />
						</SelectInputSingleTrigger>
					</SelectTrigger>
					<SelectContent
						position="popper"
						side="bottom"
						align="start"
						sideOffset={0}
						className="z-100 border bg-popover shadow-md"
					>
						{singleSelectOptions.map(
							(opt: { label: string; value: unknown }) => (
								<SelectItem
									key={String(opt.value)}
									value={String(opt.value)}
									disabled={disabledSet.has(String(opt.value))}
								>
									{opt.label}
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>
			</div>
		</FieldWrapper>
	);
}
SelectInput.displayName = 'SelectInput';
