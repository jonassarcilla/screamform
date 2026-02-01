import { test, expect } from '@playwright/test';

test.describe('FormContainer Integration', () => {
	test('should synchronize engine state with widget inputs', async ({
		page,
	}) => {
		// Navigate to the Storybook isolate frame
		await page.goto('/iframe.html?id=components-formcontainer--default');

		const titleInput = page.getByTestId('field-title');
		const budgetInput = page.getByTestId('field-budget');

		await titleInput.fill('SOC 2 Compliance');
		await budgetInput.fill('5000');

		await expect(titleInput).toHaveValue('SOC 2 Compliance');
		await expect(budgetInput).toHaveValue('5000');
	});
});
