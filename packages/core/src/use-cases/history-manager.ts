export interface HistoryState {
	past: Record<string, unknown>[];
	present: Record<string, unknown>;
	future: Record<string, unknown>[];
}

export const historyManager = {
	/**
	 * RECORD: Only adds a snapshot if the data is "Clean".
	 * A state is clean if all changes to 'autoSave: true' fields are synced
	 * and 'autoSave: false' fields have been manually committed.
	 */
	record: (
		state: HistoryState,
		nextPresent: Record<string, unknown>,
		isDirty: boolean, // Passed from the UI Hook
	): HistoryState => {
		// 1. If there are uncommitted (dirty) changes, we do NOT record a history snapshot.
		if (isDirty) return state;

		// 2. Avoid duplicate snapshots
		if (JSON.stringify(state.present) === JSON.stringify(nextPresent)) {
			return state;
		}

		return {
			past: [...state.past, state.present].slice(-20), // Keep last 20
			present: nextPresent,
			future: [],
		};
	},

	undo: (state: HistoryState): HistoryState => {
		if (state.past.length === 0) return state;
		const previous = state.past[state.past.length - 1] as Record<
			string,
			unknown
		>;
		return {
			past: state.past.slice(0, -1),
			present: previous,
			future: [state.present, ...state.future],
		};
	},

	redo: (state: HistoryState): HistoryState => {
		if (state.future.length === 0) return state;
		const next = state.future[0] as Record<string, unknown>;
		return {
			past: [...state.past, state.present],
			present: next,
			future: state.future.slice(1),
		};
	},
};
