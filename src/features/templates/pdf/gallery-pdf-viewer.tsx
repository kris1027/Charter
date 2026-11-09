import { useState, type ReactNode } from 'react';
import { BlobProvider } from '@react-pdf/renderer';
import { TemplatePDF, type TemplatePdfInput } from '@/features/templates/pdf/template-pdf';
import { cn } from '@/lib/utils';

type GalleryPdfViewerProps = TemplatePdfInput & {
    title: string;
    placeholder: ReactNode;
};

// The gallery detail panel: the placeholder stays until the PDF has loaded once. BlobProvider,
// not PDFViewer, since PDFViewer gives no signal that its PDF is ready (spec 0011). Load it
// through LazyGalleryPdfViewer so the @react-pdf engine stays out of the page's first load.
const GalleryPdfViewer = ({
    templateId,
    data,
    compactScale,
    lang,
    title,
    placeholder,
}: GalleryPdfViewerProps) => {
    const [hasLoaded, setHasLoaded] = useState(false);

    return (
        <BlobProvider
            document={
                <TemplatePDF
                    templateId={templateId}
                    data={data}
                    compactScale={compactScale}
                    lang={lang}
                />
            }
        >
            {({ url, error }) => (
                <div className='relative h-full w-full'>
                    {(error || !hasLoaded) && placeholder}
                    {url && !error && (
                        // The url stays the old one until a new render ends, so a language
                        // change keeps the previous PDF on screen until the new one is ready
                        <iframe
                            src={`${url}#toolbar=0`}
                            title={title}
                            width='100%'
                            height='100%'
                            onLoad={() => setHasLoaded(true)}
                            className={cn('absolute inset-0', !hasLoaded && 'opacity-0')}
                        />
                    )}
                </div>
            )}
        </BlobProvider>
    );
};

export default GalleryPdfViewer;
