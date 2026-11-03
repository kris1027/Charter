import { DatePicker } from '@/components/ui/date-picker';
import { useFieldContext } from '@/features/builder/form-context';
import { FieldLabel } from '@/features/builder/fields/field-label';

type DateFieldProps = {
    label: string;
    disabled?: boolean;
    yearOnly?: boolean;
    placeholder?: string;
};

// Stores an ISO string, or '' when the date is cleared
export const DateField = ({ label, disabled, yearOnly, placeholder }: DateFieldProps) => {
    const field = useFieldContext<string>();

    return (
        <div className='space-y-2'>
            <FieldLabel htmlFor={field.name} label={label} />
            <DatePicker
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(date) => field.handleChange(date ? date.toISOString() : '')}
                disabled={disabled}
                yearOnly={yearOnly}
                placeholder={placeholder}
            />
        </div>
    );
};
