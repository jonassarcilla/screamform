/**
 * Safety-net tests for undo/redo history management.
 *
 * Important: With autoSave: true, every keystroke from `userEvent.type()`
 * creates a separate history entry. A single undo only goes back one
 * character, not the whole word. Tests use single-character typing or
 * the correct number of undo clicks.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderForm } from '@/__test-utils__/render-form';
import { makeSchema, makeTextField } from '@/__test-utils__/schema-factories';

function makeNameSchema() {
	return makeSchema({
		name: makeTextField({ label: 'Name' }),
	});
}

describe('Undo / Redo', () => {
	it('undo reverts the last character (one history step)', async () => {
		const { user } = renderForm(makeNameSchema(), {
			dataConfig: { name: '' },
		});

		const nameInput = screen.getByTestId('field-name');

		// Type a single character — creates exactly one history entry
		await user.type(nameInput, 'A');
		await waitFor(() => {
			expect(nameInput).toHaveValue('A');
		});

		// Click Undo
		const undoButton = screen.getByTitle('Undo last commit');
		await user.click(undoButton);

		// Name should revert to initial empty value
		await waitFor(() => {
			expect(nameInput).toHaveValue('');
		});
	});

	it('multiple undos revert all characters back to initial state', async () => {
		const { user } = renderForm(makeNameSchema(), {
			dataConfig: { name: '' },
		});

		const nameInput = screen.getByTestId('field-name');

		// Type "AB" — creates 2 history entries
		await user.type(nameInput, 'AB');
		await waitFor(() => {
			expect(nameInput).toHaveValue('AB');
		});

		const undoButton = screen.getByTitle('Undo last commit');

		// First undo: AB → A
		await user.click(undoButton);
		await waitFor(() => {
			expect(nameInput).toHaveValue('A');
		});

		// Second undo: A → ''
		await user.click(undoButton);
		await waitFor(() => {
			expect(nameInput).toHaveValue('');
		});
	});

	it('redo restores the last undone step', async () => {
		const { user } = renderForm(makeNameSchema(), {
			dataConfig: { name: '' },
		});

		const nameInput = screen.getByTestId('field-name');

		// Type single char → undo → redo
		await user.type(nameInput, 'X');
		await waitFor(() => expect(nameInput).toHaveValue('X'));

		const undoButton = screen.getByTitle('Undo last commit');
		await user.click(undoButton);
		await waitFor(() => expect(nameInput).toHaveValue(''));

		const redoButton = screen.getByTitle('Redo next commit');
		await user.click(redoButton);

		await waitFor(() => {
			expect(nameInput).toHaveValue('X');
		});
	});

	it('undo button is disabled when there is no history', () => {
		renderForm(makeNameSchema(), { dataConfig: { name: '' } });

		const undoButton = screen.getByTitle('Undo last commit');
		expect(undoButton).toBeDisabled();
	});

	it('redo button is disabled when at the latest entry', async () => {
		const { user } = renderForm(makeNameSchema(), {
			dataConfig: { name: '' },
		});

		const nameInput = screen.getByTestId('field-name');
		await user.type(nameInput, 'Z');

		await waitFor(() => {
			const redoButton = screen.getByTitle('Redo next commit');
			expect(redoButton).toBeDisabled();
		});
	});
});
