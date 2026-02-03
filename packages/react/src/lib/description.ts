import { marked } from 'marked';
import { sanitizeDescription } from './sanitize';

const URL_PREFIX = /^https?:\/\//i;
const MD_EXT = /\.md(\?|#|$)/i;

/**
 * True if description is an HTTP(S) URL (e.g. link to a markdown file).
 */
export function isDescriptionUrl(description: string): boolean {
	return URL_PREFIX.test(description.trim());
}

/**
 * True if the URL or content suggests markdown (e.g. .md extension).
 */
function isMarkdownUrl(url: string): boolean {
	return MD_EXT.test(url);
}

/**
 * Resolves description to safe HTML.
 * - Plain string or HTML string: sanitized and returned.
 * - URL (http/https): fetched; if .md or markdown-like, converted to HTML then sanitized.
 * Note: Cross-origin URLs can fail in the browser if the server does not send CORS headers (e.g. Access-Control-Allow-Origin). Same-origin URLs or CORS-enabled hosts work.
 */
export async function resolveDescriptionToHtml(
	description: string,
): Promise<string> {
	const trimmed = description.trim();
	if (!isDescriptionUrl(trimmed)) {
		return sanitizeDescription(trimmed);
	}
	try {
		const res = await fetch(trimmed);
		if (!res.ok) {
			throw new Error(`Failed to load: ${res.status}`);
		}
		const text = await res.text();
		const contentType = res.headers.get('content-type') ?? '';
		const treatAsMarkdown =
			isMarkdownUrl(trimmed) ||
			contentType.includes('markdown') ||
			contentType.includes('text/md');
		const rawHtml = treatAsMarkdown
			? (marked.parse(text, { async: false }) as string)
			: text;
		return sanitizeDescription(rawHtml);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		// Browser often gives a generic "Failed to fetch" when CORS blocks the response
		const isLikelyCorsOrNetwork =
			message === 'Failed to fetch' ||
			message.includes('NetworkError') ||
			message.includes('Load failed');
		const hint = isLikelyCorsOrNetwork
			? ' The server may not allow cross-origin requests (CORS). Try a same-origin URL or a host that sends Access-Control-Allow-Origin.'
			: '';
		throw new Error(`Could not load description from URL: ${message}${hint}`);
	}
}
