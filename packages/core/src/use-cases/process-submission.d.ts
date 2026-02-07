import type { UISchema } from '../domain/schema/types';
/**
 * The final payload contract.
 */
export interface SubmissionResult {
	success: boolean;
	data: Record<string, unknown> | null;
	errors: Record<string, string> | null;
}
/**
 * THE FINALIZER: Prepares data for persistence.
 * This function is the "Exit-Gate" for the core package.
 */
export declare const processSubmission: (
	schema: UISchema,
	rawData: Record<string, unknown>,
	configData?: Record<string, unknown>,
) => SubmissionResult;
//# sourceMappingURL=process-submission.d.ts.map
