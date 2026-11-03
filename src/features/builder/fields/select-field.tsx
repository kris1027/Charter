import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/features/builder/form-context';
import { FieldLabel } from '@/features/builder/fields/field-label';

type SelectFieldProps = {
    label: string;
    options: { value: string; label: string }[];
    placeholder?: string;
};

export const SelectField = ({ label, options, placeholder }: SelectFieldProps) => {
    const field = useFieldContext<string>();

    return (
        <div className='space-y-2'>
            <FieldLabel htmlFor={field.name} label={label} />
            <Select name={field.name} value={field.state.value} onValueChange={field.handleChange}>
                <SelectTrigger id={field.name}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
