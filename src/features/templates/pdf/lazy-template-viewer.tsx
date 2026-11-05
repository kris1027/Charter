import { lazy, Suspense, type ReactNode } from 'react';
import type { TemplateViewerProps } from '@/features/templates/pdf/template-viewer';

const TemplateViewer = lazy(() => import('@/features/templates/pdf/template-viewer'));

type LazyTemplateViewerProps = TemplateViewerProps & {
    fallback: ReactNode;
};

// Streams the @react-pdf engine in after the page shell renders (spec 0008)
export const LazyTemplateViewer = ({ fallback, ...props }: LazyTemplateViewerProps) => (
    <Suspense fallback={fallback}>
        <TemplateViewer {...props} />
    </Suspense>
);
