import { useFormActions, useFormMeta } from '../../providers/FormContext';
import { Button } from '../ui/button';
import { Undo2, Redo2, Info } from 'lucide-react';

export function HistoryToolbar() {
	const { undo, redo } = useFormActions();
	const { canUndo, canRedo, isFormDirty } = useFormMeta();

	return (
		<div className="mb-4 flex items-center justify-between rounded-md border bg-muted/30 p-2">
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={undo}
					disabled={!canUndo}
					className="h-8 w-8 p-0"
					title="Undo last commit"
				>
					<Undo2 className="h-4 w-4" />
				</Button>

				<Button
					variant="ghost"
					size="sm"
					onClick={redo}
					disabled={!canRedo}
					className="h-8 w-8 p-0"
					title="Redo next commit"
				>
					<Redo2 className="h-4 w-4" />
				</Button>
			</div>

			{/* Status Message */}
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				{isFormDirty ? (
					<>
						<Info className="h-3 w-3 text-blue-500" />
						<span>Commit changes to enable history</span>
					</>
				) : (
					<span>History active</span>
				)}
			</div>
		</div>
	);
}
