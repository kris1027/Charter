import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { useFieldContext } from '@/features/builder/form-context';
import { FieldLabel } from '@/features/builder/fields/field-label';

type TextFieldProps = {
    label: string;
    placeholder?: string;
    type?: 'email' | 'tel' | 'url';
    required?: boolean;
};

export const TextField = ({ label, placeholder, type, required = false }: TextFieldProps) => {
    const field = useFieldContext<string>();
    const { errors, isTouched, isValid } = field.state.meta;
    const isInvalid = isTouched && !isValid;
    // Required inputs keep their transition class; others gain only the invalid border
    const inputClass = required
        ? `transition-all ${isInvalid ? 'border-red-500' : ''}`
        : isInvalid
          ? 'border-red-500'
          : undefined;

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
                className={inputClass}
            />
            <FieldError errors={errors} isTouched={isTouched} />
        </div>
    );
};
