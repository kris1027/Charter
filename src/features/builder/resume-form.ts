import { createFormHook, formOptions } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/features/builder/form-context';
import { BulletTextareaField } from '@/features/builder/fields/bullet-textarea-field';
import { CheckboxField } from '@/features/builder/fields/checkbox-field';
import { DateField } from '@/features/builder/fields/date-field';
import { SelectField } from '@/features/builder/fields/select-field';
import { TextField } from '@/features/builder/fields/text-field';
import { TextareaField } from '@/features/builder/fields/textarea-field';
import { resumeFormSchema } from '@/features/resume/resume-schema';
import { EMPTY_RESUME } from '@/features/resume/stored-resume';

// The one resume form: the page creates it with useAppForm, sections receive it through withForm
export const { useAppForm, withForm } = createFormHook({
    fieldContext,
    formContext,
    fieldComponents: {
        TextField,
        TextareaField,
        BulletTextareaField,
        DateField,
        CheckboxField,
        SelectField,
    },
    formComponents: {},
});

export const resumeFormOptions = formOptions({
    defaultValues: EMPTY_RESUME,
    validators: { onChange: resumeFormSchema },
});
