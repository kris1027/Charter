import { createFormHookContexts } from '@tanstack/react-form';

// Its own file so the field components and resume-form.ts do not import each other
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
