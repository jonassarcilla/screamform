import type { UISchema } from "../schema/types";

/**
 * HELPER: Retrieves a value from a potentially nested object using dot notation.
 * e.g., getDeepValue(data, "user.name")
 */
const getDeepValue = (
    obj: Record<string, unknown>,
    path: string
): unknown => {
    return path.split('.').reduce<unknown>(
        (prev, curr) => (prev !== null && prev !== undefined && typeof prev === 'object' && curr in prev
            ? (prev as Record<string, unknown>)[curr]
            : undefined),
        obj
    );
};

/**
 * HELPER: Sets a value in a nested object, creating objects along the path if missing.
 * e.g., setDeepValue({}, "user.name", "John") -> { user: { name: "John" } }
 */
const setDeepValue = (
    obj: Record<string, unknown>,
    path: string,
    value: unknown
): void => {
    const keys = path.split('.');
    let current: Record<string, unknown> = obj;

    while (keys.length > 1) {
        const key = keys.shift()!;
        if (!(key in current)) current[key] = {};
        current = current[key] as Record<string, unknown>;
    }
    const lastKey = keys[0];
    if (lastKey !== undefined) current[lastKey] = value;
};

/**
 * COERCION: Ensures the value matches the expected primitive for the widget.
 */
const coerceValue = (value: unknown, widget: string): unknown => {
    if (value === null || value === undefined) return null;

    switch (widget) {
        case 'checkbox':
        case 'switch':
            if (typeof value === 'string') return value === 'true';
            return !!value;
        case 'number-input':
        case 'slider':
            const parsed = typeof value === 'string' ? parseFloat(value) : value;
            return isNaN(parsed as number) ? 0 : parsed;
        default:
            return value;
    }
};

/**
 * THE SANITIZER: Filters, Coerces, and Unflattens form data.
 */
export const sanitizeFormData = (
    schema: UISchema,
    rawData: Record<string, unknown>
): Record<string, unknown> => {
    const sanitized: Record<string, unknown> = {};

    for (const [key, field] of Object.entries(schema.fields)) {
        // 1. Extract the value (supports nested 'a.b.c' or flat 'a')
        const rawValue = getDeepValue(rawData, key);

        // 2. Clean and Coerce
        const cleanValue = coerceValue(rawValue, field.widget);

        // 3. Reconstruct into a clean nested object
        setDeepValue(sanitized, key, cleanValue);
    }

    return sanitized;
};