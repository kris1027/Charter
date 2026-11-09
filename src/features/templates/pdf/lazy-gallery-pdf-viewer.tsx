import { lazy, Suspense, type ComponentProps } from 'react';

const GalleryPdfViewer = lazy(() => import('@/features/templates/pdf/gallery-pdf-viewer'));

type LazyGalleryPdfViewerProps = ComponentProps<typeof GalleryPdfViewer>;

// Streams the @react-pdf engine in after the page shell renders (spec 0008)
export const LazyGalleryPdfViewer = (props: LazyGalleryPdfViewerProps) => (
    <Suspense fallback={props.placeholder}>
        <GalleryPdfViewer {...props} />
    </Suspense>
);
