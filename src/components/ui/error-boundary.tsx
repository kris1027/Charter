import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ErrorFallbackProps = {
    error: Error;
    resetErrorBoundary: () => void;
};

const FALLBACK_STRINGS = {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    details: 'Error details',
    tryAgain: 'Try Again',
} as const;

const FALLBACK_KEY_MAP: Record<string, string> = {
    'errorBoundary.title': FALLBACK_STRINGS.title,
    'errorBoundary.description': FALLBACK_STRINGS.description,
    'errorBoundary.details': FALLBACK_STRINGS.details,
    'errorBoundary.tryAgain': FALLBACK_STRINGS.tryAgain,
};

const useSafeTranslation = () => {
    const { t, ready } = useTranslation();

    if (!ready) {
        return (key: string) => FALLBACK_KEY_MAP[key] ?? key;
    }

    return (key: string) => {
        try {
            const result = t(key);
            return typeof result === 'string' && result !== key
                ? result
                : (FALLBACK_KEY_MAP[key] ?? key);
        } catch {
            return FALLBACK_KEY_MAP[key] ?? key;
        }
    };
};

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
    const t = useSafeTranslation();

    return (
        <div className='flex min-h-[200px] items-center justify-center p-6'>
            <div className='bg-card text-card-foreground border-destructive/30 shadow-surface mx-auto max-w-md rounded-2xl border p-8 text-center'>
                <div className='bg-destructive/15 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
                    <AlertTriangle className='text-destructive h-6 w-6' aria-hidden='true' />
                </div>
                <h2 className='mb-2 text-lg font-semibold'>{t('errorBoundary.title')}</h2>
                <p className='text-muted-foreground mb-4 text-sm'>
                    {t('errorBoundary.description')}
                </p>
                <details className='text-muted-foreground mb-4 text-left text-xs'>
                    <summary className='cursor-pointer'>{t('errorBoundary.details')}</summary>
                    <pre className='bg-muted mt-2 overflow-auto rounded p-2'>{error.message}</pre>
                </details>
                <Button onClick={resetErrorBoundary}>{t('errorBoundary.tryAgain')}</Button>
            </div>
        </div>
    );
};

type ErrorBoundaryProps = {
    children: ReactNode;
    fallback?: (props: ErrorFallbackProps) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ErrorBoundaryState = {
    hasError: boolean;
    error: Error | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.props.onError?.(error, errorInfo);
    }

    resetErrorBoundary = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback;
            if (FallbackComponent) {
                return (
                    <FallbackComponent
                        error={this.state.error}
                        resetErrorBoundary={this.resetErrorBoundary}
                    />
                );
            }
            return (
                <ErrorFallback
                    error={this.state.error}
                    resetErrorBoundary={this.resetErrorBoundary}
                />
            );
        }

        return this.props.children;
    }
}

export { ErrorBoundary, ErrorFallback };
export type { ErrorBoundaryProps, ErrorFallbackProps };
