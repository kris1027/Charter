import { Textarea } from '@/components/ui/textarea';
import { FieldError } from '@/components/ui/field-error';
import { useFieldContext } from '@/features/builder/form-context';
import { fieldA11y } from '@/features/builder/fields/field-a11y';
import { FieldLabel } from '@/features/builder/fields/field-label';

type BulletTextareaFieldProps = {
    label: string;
    placeholder?: string;
    hint: string;
};

// A textarea that keeps every line a bullet point
export const BulletTextareaField = ({ label, placeholder, hint }: BulletTextareaFieldProps) => {
    const field = useFieldContext<string>();
    const { errors, isTouched } = field.state.meta;
    const hintId = `${field.name}-hint`;
    const { errorId, ariaProps } = fieldA11y(field.name, field.state.meta, hintId);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        let value = e.target.value;
        // Add bullet point at the start if empty and user starts typing
        if (value.length === 1 && value !== '•') {
            value = '• ' + value;
        }
        field.handleChange(value);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        // Handle pasting into empty field - add bullet point
        if (field.state.value.length > 0) return;
        const pastedText = e.clipboardData.getData('text');
        if (pastedText && !pastedText.trimStart().startsWith('•')) {
            e.preventDefault();
            field.handleChange('• ' + pastedText.trimStart());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const target = e.currentTarget;
        const { selectionStart, selectionEnd, value } = target;
        field.handleChange(
            value.substring(0, selectionStart) + '\n• ' + value.substring(selectionEnd),
        );
        // Set cursor position after the bullet point (requestAnimationFrame ensures DOM has updated)
        requestAnimationFrame(() => {
            target.selectionStart = target.selectionEnd = selectionStart + 3;
        });
    };

    return (
        <div className='space-y-2'>
            <FieldLabel htmlFor={field.name} label={label} />
            <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className='min-h-[120px] resize-none'
                {...ariaProps}
            />
            <FieldError id={errorId} errors={errors} isTouched={isTouched} />
            <p id={hintId} className='text-muted-foreground text-xs'>
                {hint}
            </p>
        </div>
    );
};
