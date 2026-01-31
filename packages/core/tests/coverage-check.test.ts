import { test, expect } from 'bun:test';
import * as core from '../src/index.ts';

test('ensure all source files are tracked for coverage', () => {
	expect(core).toBeDefined();
});
