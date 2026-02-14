/**
 * Safety-net tests for autoSave vs manual commit behavior.
 *
 * autoSave: true (default) — value is committed on every keystroke.
 * autoSave: false           — value stays as working data until explicit commit.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderForm } from '@/__test-utils__/render-form';
import { makeManualCommitSchema } from '@/__test-utils__/schema-factories';

describe('autoSave vs manual commit', () => {
	it('autoSave: true field immediately reflects in form state', async () => {
		const { user } = renderForm(makeManualCommitSchema(), {
			dataConfig: { autoField: '', manualField: '' },
		});

		const autoInput = screen.getByTestId('field-autoField');
		await user.type(autoInput, 'instant');

		// Value should be reflected in the input (auto-saved)
		await waitFor(() => {
			expect(autoInput).toHaveValue('instant');
		});
	});

	it('autoSave: false field shows commit/discard buttons when dirty', async () => {
		const { user } = renderForm(makeManualCommitSchema(), {
			dataConfig: { autoField: '', manualField: '' },
		});

		const manualInput = screen.getByTestId('field-manualField');
		await user.type(manualInput, 'draft');

		// Commit and Discard buttons should appear
		await waitFor(() => {
			expect(screen.getByTitle('Commit change')).toBeInTheDocument();
			expect(screen.getByTitle('Discard change')).toBeInTheDocument();
		});
	});

	it('discard on autoSave: false field reverts the draft', async () => {
		const { user } = renderForm(makeManualCommitSchema(), {
			dataConfig: { autoField: '', manualField: '' },
		});

		const manualInput = screen.getByTestId('field-manualField');
		await user.type(manualInput, 'draft value');

		// Click Discard
		await waitFor(() => {
			expect(screen.getByTitle('Discard change')).toBeInTheDocument();
		});
		const discardButton = screen.getByTitle('Discard change');
		await user.click(discardButton);

		// The input should revert to the original empty value
		await waitFor(() => {
			expect(manualInput).toHaveValue('');
		});
	});

	it('commit on autoSave: false field persists the value', async () => {
		const { user } = renderForm(makeManualCommitSchema(), {
			dataConfig: { autoField: '', manualField: '' },
		});

		const manualInput = screen.getByTestId('field-manualField');
		await user.type(manualInput, 'committed value');

		// Click Commit
		await waitFor(() => {
			expect(screen.getByTitle('Commit change')).toBeInTheDocument();
		});
		const commitButton = screen.getByTitle('Commit change');
		await user.click(commitButton);

		// Commit/discard buttons should disappear (no longer dirty)
		await waitFor(() => {
			expect(screen.queryByTitle('Commit change')).not.toBeInTheDocument();
			expect(screen.queryByTitle('Discard change')).not.toBeInTheDocument();
		});

		// Value should be persisted
		expect(manualInput).toHaveValue('committed value');
	});
});
