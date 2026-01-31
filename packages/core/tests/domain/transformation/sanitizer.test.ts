import { sanitizeFormData } from '@screamform/core/domain/transformation/sanitizer';
import { test, expect } from 'bun:test';

test("Sanitizer: nested keys and coercion", () => {
    const schema: any = {
        fields: {
            "profile.age": { widget: "number-input" },
            "settings.active": { widget: "checkbox" }
        }
    };
    const dirtyData = {
        profile: { age: "25", junk: "ignore_me" },
        settings: { active: "true" },
        malicious: "attack"
    };

    const clean = sanitizeFormData(schema, dirtyData);

    expect(clean).toEqual({
        profile: { age: 25 },
        settings: { active: true }
    });
    expect(clean).not.toHaveProperty("malicious");
});