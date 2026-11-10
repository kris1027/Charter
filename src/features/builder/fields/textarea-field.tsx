import { Textarea } from '@/components/ui/textarea';
import { FieldError } from '@/components/ui/field-error';
import { useFieldContext } from '@/features/builder/form-context';
import { fieldA11y } from '@/features/builder/fields/field-a11y';
import { FieldLabel } from '@/features/builder/fields/field-label';

type TextareaFieldProps = {
    label: string;
    placeholder?: string;
    className?: string;
};

export const TextareaField = ({ label, placeholder, className }: TextareaFieldProps) => {
    const field = useFieldContext<string>();
    const { errors, isTouched } = field.state.meta;
    const { errorId, ariaProps } = fieldA11y(field.name, field.state.meta);

    return (
        <div className='space-y-2'>
            <FieldLabel htmlFor={field.name} label={label} />
            <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={placeholder}
                className={className}
                {...ariaProps}
            />
            <FieldError id={errorId} errors={errors} isTouched={isTouched} />
        </div>
    );
};
