import { type ReactNode, useState, useEffect } from 'react';
import { Check, Info, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { sanitizeDescription } from '@/lib/sanitize';
import { isDescriptionUrl, resolveDescriptionToHtml } from '@/lib/description';
import { cn } from '@/lib/utils';

export interface FieldWrapperProps {
	label: string;
	isRequired?: boolean;
	error?: string | null;
	/** When false, commit/discard icons show when isDirty */
	autoSave?: boolean;
	isDirty?: boolean;
	onCommit?: () => void;
	onDiscard?: () => void;
	/**
	 * When set, show info icon that opens a popover.
	 * Accepts: plain string, HTML string (sanitized), or URL to a markdown file (fetched, converted to HTML, sanitized).
	 */
	description?: string | null;
	isDisabled?: boolean;
	/** Default (first) data type for display/casting */
	dataType?: string;
	/** All allowed types when multiple; first is default. Pill shows e.g. "String | Number". */
	dataTypes?: string[];
	className?: string;
	/** Input element(s) rendered below the label row */
	children: ReactNode;
}

function dataTypeLabel(dataType?: string): string {
	if (dataType === 'number') return 'Number';
	if (dataType === 'boolean') return 'Boolean';
	if (dataType === 'date') return 'Date';
	if (dataType === 'code') return 'Code';
	return 'String';
}

function dataTypePillLabel(dataType?: string, dataTypes?: string[]): string {
	if (dataTypes != null && dataTypes.length > 0) {
		return dataTypes.map(dataTypeLabel).join(' | ');
	}
	return dataTypeLabel(dataType);
}

export function FieldWrapper({
	label,
	isRequired,
	error,
	autoSave = true,
	isDirty = false,
	onCommit,
	onDiscard,
	description,
	isDisabled,
	dataType,
	dataTypes,
	className,
	children,
}: FieldWrapperProps) {
	const showCommitDiscard = !autoSave && isDirty && !isDisabled;

	const [popoverOpen, setPopoverOpen] = useState(false);
	const [urlContent, setUrlContent] = useState<string | null>(null);
	const [urlLoading, setUrlLoading] = useState(false);
	const [urlError, setUrlError] = useState<string | null>(null);

	const isUrl =
		description != null && description !== '' && isDescriptionUrl(description);

	useEffect(() => {
		if (!popoverOpen || !isUrl || description == null) return;
		let cancelled = false;
		setUrlContent(null);
		setUrlError(null);
		setUrlLoading(true);
		resolveDescriptionToHtml(description)
			.then((html) => {
				if (!cancelled) {
					setUrlContent(html);
					setUrlError(null);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setUrlError(err instanceof Error ? err.message : String(err));
					setUrlContent(null);
				}
			})
			.finally(() => {
				if (!cancelled) setUrlLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [popoverOpen, isUrl, description]);

	const descriptionHtml = (() => {
		if (description == null || description === '') return '';
		if (isUrl) {
			if (urlError) return null;
			if (urlLoading) return null;
			return urlContent ?? '';
		}
		return sanitizeDescription(description);
	})();

	return (
		<div className={cn('grid w-full gap-1.5', className)}>
			{/* Row 1: Label (left) | commit, discard, info (right) */}
			<div className="flex w-full items-center justify-between gap-2">
				<Label className={cn(error && 'text-destructive')}>
					{label}{' '}
					{isRequired && <span className="font-bold text-destructive">*</span>}
				</Label>
				<div className="flex shrink-0 items-center gap-0.5">
					{showCommitDiscard && (
						<>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								onClick={onCommit}
								className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
								title="Commit change"
							>
								<Check className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								onClick={onDiscard}
								className="h-8 w-8 text-destructive hover:bg-destructive/10"
								title="Discard change"
							>
								<X className="h-4 w-4" />
							</Button>
						</>
					)}
					{description != null && description !== '' && (
						<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
							<PopoverTrigger asChild>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									className="h-8 w-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
									aria-label="Field description"
								>
									<Info className="h-4 w-4" aria-hidden />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								align="end"
								side="bottom"
								sideOffset={6}
								className="max-w-sm text-sm"
							>
								{urlLoading && (
									<p className="text-muted-foreground">Loading…</p>
								)}
								{urlError != null && (
									<p className="text-destructive text-sm">{urlError}</p>
								)}
								{descriptionHtml != null &&
									descriptionHtml !== '' &&
									!urlLoading &&
									!urlError && (
										<div
											className="[&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_p:last-child]:mb-0 [&_p]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_ul]:list-disc [&_ul]:pl-4"
											dangerouslySetInnerHTML={{ __html: descriptionHtml }}
										/>
									)}
							</PopoverContent>
						</Popover>
					)}
					<Badge variant="outline" className="font-normal">
						{dataTypePillLabel(dataType, dataTypes)}
					</Badge>
				</div>
			</div>

			{/* Row 2: Input (children); full width so form width is not reduced by icon space */}
			<div className="relative flex w-full min-w-0 items-center gap-2">
				{children}
			</div>

			{/* Row 3: Error */}
			{error && (
				<p className="fade-in animate-in font-medium text-[0.8rem] text-destructive duration-200">
					{error}
				</p>
			)}
		</div>
	);
}
FieldWrapper.displayName = 'FieldWrapper';
