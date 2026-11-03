import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useFieldContext } from '@/features/builder/form-context';

type CheckboxFieldProps = {
    label: string;
};

export const CheckboxField = ({ label }: CheckboxFieldProps) => {
    const field = useFieldContext<boolean>();

    return (
        <div className='flex items-center space-x-2 rounded-lg border border-slate-200/60 bg-slate-50/60 p-3 dark:border-white/5 dark:bg-white/[0.03]'>
            <Checkbox
                id={field.name}
                name={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(!!checked)}
            />
            <Label
                htmlFor={field.name}
                className='cursor-pointer text-slate-700 dark:text-slate-300'
            >
                {label}
            </Label>
        </div>
    );
};
