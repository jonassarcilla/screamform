import DOMPurify from 'dompurify';

/** Allowed tags for mini-documentation / field description HTML */
const ALLOWED_TAGS = [
	'p',
	'br',
	'strong',
	'em',
	'b',
	'i',
	'a',
	'ul',
	'ol',
	'li',
	'code',
	'pre',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'span',
	'div',
];

const ALLOWED_ATTR = ['href', 'class', 'target', 'rel'];

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Sanitizes HTML for safe use in field description / mini-documentation.
 * In the browser uses DOMPurify with an allowlist; in SSR or test env escapes HTML.
 */
export function sanitizeDescription(html: string): string {
	if (typeof document === 'undefined') {
		return escapeHtml(html);
	}
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS,
		ALLOWED_ATTR,
	});
}
