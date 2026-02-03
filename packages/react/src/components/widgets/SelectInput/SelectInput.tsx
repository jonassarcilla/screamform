import { useMemo, useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { WidgetProps } from '../Registry';
import type { LogicValue } from '@screamform/core';
import { useForm } from '@/providers/FormContext';

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
	options = [],
	multiple,
	maxItems,
	dataType,
}: WidgetProps) {
	const { formVersion, getField } = useForm();
	const [multiOpen, setMultiOpen] = useState(false);
	const multiRef = useRef<HTMLDivElement>(null);

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

	useEffect(() => {
		const field = fieldKey != null ? getField(fieldKey) : undefined;
		const engineValue = field?.value;
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
	}, [formVersion, fieldKey, multiple]);

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

		return (
			<div className="grid w-full gap-1.5">
				<Label className={cn(error && 'text-destructive')}>
					{label} {isRequired && <span className="text-destructive">*</span>}
					{maxItems != null && (
						<span className="ml-2 text-xs font-normal text-muted-foreground">
							({multiValues.length}/{maxItems})
						</span>
					)}
				</Label>
				<div ref={multiRef} className="relative flex w-full items-center gap-2">
					<div className="relative min-w-0 flex-1">
						<Button
							type="button"
							variant="outline"
							disabled={isDisabled}
							className={cn(
								'w-full justify-between h-auto min-h-10 text-left font-normal',
								error && 'border-destructive',
								!autoSave && isDirtyMulti && 'pr-20',
							)}
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
											{optionList.find((o) => String(o.value) === String(v))
												?.label ?? String(v)}
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
												aria-label={`Remove ${optionList.find((o) => String(o.value) === String(v))?.label ?? v}`}
											>
												<X
													className="h-3 w-3 pointer-events-none"
													aria-hidden
												/>
											</span>
										</Badge>
									))
								) : (
									<span className="text-muted-foreground">{placeholder}</span>
								)}
							</div>
							<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
						</Button>
						{multiOpen && (
							<div
								className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[300px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
								role="listbox"
							>
								{optionList.length === 0 ? (
									<div className="py-4 text-center text-sm text-muted-foreground">
										No options
									</div>
								) : (
									optionList.map((opt) => {
										const isSelected = multiValues.some(
											(v) => String(v) === String(opt.value),
										);
										return (
											<button
												key={String(opt.value)}
												type="button"
												role="option"
												aria-selected={isSelected}
												className={cn(
													'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
													isSelected && 'bg-accent',
												)}
												onClick={() => handleToggleMultiple(opt.value)}
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
									})
								)}
							</div>
						)}
					</div>
					{!autoSave && isDirtyMulti && !isDisabled && (
						<div className="flex shrink-0 items-center gap-0.5 animate-in fade-in slide-in-from-right-1 duration-200">
							<Button
								type="button"
								size="icon"
								variant="ghost"
								onClick={handleCommitMulti}
								className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
								title="Commit change"
							>
								<Check className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								onClick={handleDiscardMulti}
								className="h-8 w-8 text-destructive hover:bg-destructive/10"
								title="Discard change"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
				{error && <p className="text-xs text-destructive mt-1">{error}</p>}
			</div>
		);
	}

	// --- RENDER SINGLE MODE ---
	const singleDisplayValue = autoSave
		? safeValue
			? String(safeValue)
			: undefined
		: draftSingle || undefined;
	return (
		<div className="grid w-full gap-1.5">
			<Label className={cn(error && 'text-destructive')}>
				{label} {isRequired && '*'}
			</Label>
			<div className="relative flex w-full items-center gap-2">
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
						<SelectTrigger
							className={cn(
								'w-full pointer-events-auto',
								error && 'border-destructive',
								!autoSave && isDirtySingle && 'pr-20',
							)}
						>
							<SelectValue placeholder={placeholder} />
						</SelectTrigger>
						<SelectContent
							position="popper"
							side="bottom"
							align="start"
							sideOffset={0}
							className="z-100 bg-popover border shadow-md"
						>
							{(options ?? []).map((opt) => (
								<SelectItem key={String(opt.value)} value={String(opt.value)}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{!autoSave && isDirtySingle && !isDisabled && (
					<div className="flex shrink-0 items-center gap-0.5 animate-in fade-in slide-in-from-right-1 duration-200">
						<Button
							type="button"
							size="icon"
							variant="ghost"
							onClick={handleCommitSingle}
							className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
							title="Commit change"
						>
							<Check className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							onClick={handleDiscardSingle}
							className="h-8 w-8 text-destructive hover:bg-destructive/10"
							title="Discard change"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
			{error && <p className="text-xs text-destructive mt-1">{error}</p>}
		</div>
	);
}
