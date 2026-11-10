type FieldMetaLike = { isTouched: boolean; isValid: boolean };

// The error id and aria props of a field that can fail validation (spec 0012, AC-20).
// Errors show only after touch, so the field turns invalid only then too
export const fieldA11y = (name: string, meta: FieldMetaLike, describedBy?: string) => {
    const isInvalid = meta.isTouched && !meta.isValid;
    const errorId = `${name}-error`;
    const ids = [describedBy, isInvalid ? errorId : undefined].filter(Boolean).join(' ');

    return {
        errorId,
        ariaProps: {
            'aria-invalid': isInvalid || undefined,
            'aria-describedby': ids || undefined,
        },
    };
};
