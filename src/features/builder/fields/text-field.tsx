import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { useFieldContext } from '@/features/builder/form-context';
import { fieldA11y } from '@/features/builder/fields/field-a11y';
import { FieldLabel } from '@/features/builder/fields/field-label';

type TextFieldProps = {
    label: string;
    placeholder?: string;
    type?: 'email' | 'tel' | 'url';
    required?: boolean;
};

// The error border comes from Input's aria-invalid style, never from a class passed here
export const TextField = ({ label, placeholder, type, required = false }: TextFieldProps) => {
    const field = useFieldContext<string>();
    const { errors, isTouched } = field.state.meta;
    const { errorId, ariaProps } = fieldA11y(field.name, field.state.meta);

    return (
        <div className='space-y-2'>
            <FieldLabel htmlFor={field.name} label={label} required={required} />
            <Input
                id={field.name}
                name={field.name}
                type={type}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={placeholder}
                {...ariaProps}
            />
            <FieldError id={errorId} errors={errors} isTouched={isTouched} />
        </div>
    );
};
