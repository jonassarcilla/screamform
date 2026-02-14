import {
	copyFileSync,
	mkdirSync,
	existsSync,
	readFileSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'src', 'styles', 'global.css');
const dest = join(root, 'dist', 'global.css');
const themeDest = join(root, 'dist', 'theme.css');

const destDir = dirname(dest);
if (!existsSync(destDir)) {
	mkdirSync(destDir, { recursive: true });
}
copyFileSync(src, dest);

// Theme-only CSS for apps that already import Tailwind (no duplicate @import "tailwindcss")
const full = readFileSync(src, 'utf8');
const themeContent = full.replace(
	/^@import "tailwindcss";\n@import "tw-animate-css";\n\n/,
	'',
);
writeFileSync(themeDest, themeContent);
