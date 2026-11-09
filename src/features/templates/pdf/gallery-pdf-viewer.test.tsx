import { fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GalleryPdfViewer from '@/features/templates/pdf/gallery-pdf-viewer';
import type { ResumeData } from '@/features/resume/form-types';
import { render, screen } from '@/test/test-utils';

type BlobState = { url: string | null; error: Error | null };

const mocks = vi.hoisted(() => ({
    state: { url: null, error: null } as { url: string | null; error: Error | null },
}));

vi.mock('@react-pdf/renderer', () => ({
    BlobProvider: ({ children }: { children: (state: BlobState) => ReactNode }) =>
        children(mocks.state),
}));

vi.mock('@/features/templates/pdf/template-pdf', () => ({
    TemplatePDF: () => null,
}));

const viewer = (lang: 'en' | 'pl' = 'en') => (
    <GalleryPdfViewer
        templateId='developer'
        data={{} as ResumeData}
        compactScale={0}
        lang={lang}
        title='Sample PDF'
        placeholder={<p>placeholder</p>}
    />
);

beforeEach(() => {
    mocks.state = { url: null, error: null };
});

describe('GalleryPdfViewer', () => {
    it('should show only the placeholder when the PDF has no url yet', () => {
        render(viewer());

        expect(screen.getByText('placeholder')).toBeInTheDocument();
        expect(screen.queryByTitle('Sample PDF')).not.toBeInTheDocument();
    });

    it('should keep the placeholder and hide the frame when the frame has not loaded', () => {
        mocks.state = { url: 'blob:one', error: null };
        render(viewer());

        const frame = screen.getByTitle('Sample PDF');
        expect(frame).toHaveAttribute('src', 'blob:one#toolbar=0');
        expect(frame).toHaveClass('opacity-0');
        expect(screen.getByText('placeholder')).toBeInTheDocument();

        fireEvent.load(frame);

        expect(frame).not.toHaveClass('opacity-0');
        expect(screen.queryByText('placeholder')).not.toBeInTheDocument();
    });

    it('should keep the placeholder and mount no frame when the render fails', () => {
        mocks.state = { url: null, error: new Error('render failed') };
        render(viewer());

        expect(screen.getByText('placeholder')).toBeInTheDocument();
        expect(screen.queryByTitle('Sample PDF')).not.toBeInTheDocument();
    });

    it('should not bring the placeholder back when the url changes after the first load', () => {
        mocks.state = { url: 'blob:one', error: null };
        const { rerender } = render(viewer());
        fireEvent.load(screen.getByTitle('Sample PDF'));

        mocks.state = { url: 'blob:two', error: null };
        rerender(viewer('pl'));

        expect(screen.getByTitle('Sample PDF')).toHaveAttribute('src', 'blob:two#toolbar=0');
        expect(screen.queryByText('placeholder')).not.toBeInTheDocument();
    });
});
