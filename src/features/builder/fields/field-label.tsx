import { Label } from '@/components/ui/label';

type FieldLabelProps = {
    htmlFor: string;
    label: string;
    required?: boolean;
};

export const FieldLabel = ({ htmlFor, label, required = false }: FieldLabelProps) => (
    <Label htmlFor={htmlFor} className={required ? 'flex items-center gap-1' : undefined}>
        {label}
        {required && (
            <>
                {' '}
                <span className='text-destructive'>*</span>
            </>
        )}
    </Label>
);
