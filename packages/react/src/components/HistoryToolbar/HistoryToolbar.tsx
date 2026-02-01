import { useForm } from '../../providers/FormContext';
import { Button } from '../ui/button';
import { Undo2, Redo2, Info } from 'lucide-react';

export function HistoryToolbar() {
	const { undo, redo, canUndo, canRedo, isFormDirty } = useForm();

	console.log('Toolbar State:', { canUndo, isFormDirty }); // Watch this as you type

	return (
		<div className="flex items-center justify-between p-2 mb-4 border rounded-md bg-muted/30">
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
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
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
