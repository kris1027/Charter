// Moves focus to the first invalid field in page order and says whether there was one
// (spec 0012, AC-23). Callers wait until the errors have rendered
export const focusFirstInvalid = (): boolean => {
    const field = document.querySelector<HTMLElement>("[data-builder-page] [aria-invalid='true']");
    if (!field) return false;
    field.focus();
    return true;
};
