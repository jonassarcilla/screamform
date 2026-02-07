import { useRef } from 'react';

/**
 * Returns the number of times the component has rendered.
 * Use with isDebug to visualize which components re-render.
 */
export function useRenderCount(): number {
	const countRef = useRef(0);
	countRef.current += 1;
	return countRef.current;
}
