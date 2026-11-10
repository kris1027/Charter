import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useFieldContext } from '@/features/builder/form-context';

type CheckboxFieldProps = {
    label: string;
};

export const CheckboxField = ({ label }: CheckboxFieldProps) => {
    const field = useFieldContext<boolean>();

    return (
        <div className='bg-muted/50 flex items-center gap-2 rounded-lg border p-3'>
            <Checkbox
                id={field.name}
                name={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(!!checked)}
            />
            <Label htmlFor={field.name} className='cursor-pointer'>
                {label}
            </Label>
        </div>
    );
};
