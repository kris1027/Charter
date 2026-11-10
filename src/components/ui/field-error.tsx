import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type FieldErrorProps = {
    // Lets the field point aria-describedby at the message
    id?: string;
    errors: ReadonlyArray<string | { message: string } | undefined>;
    isTouched: boolean;
};

export const FieldError = ({ id, errors, isTouched }: FieldErrorProps) => {
    const { t } = useTranslation();

    const validErrors = errors.filter(
        (err): err is string | { message: string } => err !== undefined,
    );

    if (!isTouched || validErrors.length === 0) return null;

    const message = validErrors
        .map((err) => {
            const msg = typeof err === 'string' ? err : err.message;
            return t(msg);
        })
        .join(', ');

    return (
        <p id={id} role='alert' className='text-destructive flex items-center gap-1 text-sm'>
            <AlertCircle className='h-3 w-3' aria-hidden='true' />
            {message}
        </p>
    );
};
