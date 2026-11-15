import { useEffect, useRef, useState } from 'react';
import {
    createPreviewClient,
    type PreviewClient,
} from '@/features/pdf/live-preview/preview-client';
import { countPdfPages } from '@/features/pdf/pdf-export';
import {
    findOnePageScale,
    type CountedPdf,
    type OnePageFit,
    type OnePageSearch,
} from '@/features/preview/find-one-page-scale';
import {
    createSerialPreviewClient,
    type SerialPreviewClient,
} from '@/features/preview/serial-preview-client';
import type { ResumeData } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';

export const FIT_SEARCH_CAP_MS = 60_000;

// What /preview draws and downloads: the saved resume, its template and the page language
export type PreviewSource = { data: ResumeData; templateId: TemplateId; lang: AppLang };

export type PreviewMode = 'full' | 'onePage';
export type PreviewStatus = 'starting' | 'rendering' | 'ready' | 'failed' | 'unavailable';
export type PreviewFit = 'idle' | 'checking' | OnePageSearch['fit'];

export type PreviewDocument = {
    status: PreviewStatus;
    fit: PreviewFit;
    mode: PreviewMode;
    setMode: (mode: PreviewMode) => void;
    // The kept bytes for the selected mode
    shown: CountedPdf | null;
    // The renderer's compactScale for the selected mode: 0 (no compacting) for full, the
    // winning scale for onePage
    compactScale: number;
    retry: () => void;
};

type UsePreviewDocumentOptions = PreviewSource & {
    // Test seams. Both must keep their identity between renders: a new one starts a new run
    createClient?: () => PreviewClient;
    countPages?: (pdf: ArrayBuffer) => Promise<number | null>;
};

type State = {
    status: PreviewStatus;
    fit: PreviewFit;
    mode: PreviewMode;
    full: CountedPdf | null;
    onePage: OnePageFit | null;
};

const INITIAL: State = { status: 'starting', fit: 'idle', mode: 'full', full: null, onePage: null };
const SEARCH_CAPPED: OnePageSearch = { fit: 'failed' };

// Unavailable is latched until reload (AC-22): no later status replaces it
const latched = (current: PreviewStatus, next: PreviewStatus): PreviewStatus =>
    current === 'unavailable' ? current : next;

// The /preview engine (spec 0013): renders the saved resume in the preview worker at full size,
// then searches for the scale that fits one page, keeping the bytes of both versions. The
// worker requests go one at a time through the serial preview client.
export const usePreviewDocument = ({
    data,
    templateId,
    lang,
    createClient = createPreviewClient,
    countPages = countPdfPages,
}: UsePreviewDocumentOptions): PreviewDocument => {
    const workerRef = useRef<SerialPreviewClient | null>(null);
    const disposeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const runIdRef = useRef(0);
    const [state, setState] = useState(INITIAL);
    const [attempt, setAttempt] = useState(0);

    // Disposed when the page unmounts. The dispose waits a tick, so StrictMode's effect replay
    // in development keeps the one worker instead of starting a second
    useEffect(() => {
        clearTimeout(disposeTimerRef.current);
        return () => {
            disposeTimerRef.current = setTimeout(() => {
                workerRef.current?.dispose();
                workerRef.current = null;
            }, 0);
        };
    }, []);

    // One run: the full size render, then the fit search. A language change or Try again starts
    // a new run; the run id makes an overtaken run stop without touching state (AC-18)
    useEffect(() => {
        const runId = ++runIdRef.current;
        const isStale = () => runId !== runIdRef.current;

        const getWorker = () =>
            (workerRef.current ??= createSerialPreviewClient({
                createClient,
                onReady: () =>
                    setState((prev) =>
                        prev.status === 'starting' ? { ...prev, status: 'rendering' } : prev,
                    ),
                // The pages and their kept bytes stay; only the switch is dropped (AC-22)
                onUnavailable: () =>
                    setState((prev) => ({
                        ...prev,
                        status: 'unavailable',
                        fit: prev.fit === 'fits' ? 'failed' : prev.fit,
                    })),
            }));

        // null on a failed render, or on a page count that errors or comes back 0
        const renderCounted = async (compactScale: number): Promise<CountedPdf | null> => {
            const result = await getWorker().render({ data, templateId, compactScale, lang });
            if (!result.ok) return null;
            const pages = await countPages(result.pdf).catch(() => null);
            return pages ? { pdf: result.pdf, pages } : null;
        };

        // Trials are never drawn; past the cap, or once overtaken, no further trial is sent
        const searchOnePage = async () => {
            let capped = false;
            let capTimer: ReturnType<typeof setTimeout> | undefined;
            const cap = new Promise<OnePageSearch>((resolve) => {
                capTimer = setTimeout(() => {
                    capped = true;
                    resolve(SEARCH_CAPPED);
                }, FIT_SEARCH_CAP_MS);
            });
            const search = await Promise.race([
                findOnePageScale(async (scale) =>
                    capped || isStale() ? null : renderCounted(scale),
                ),
                cap,
            ]);
            clearTimeout(capTimer);
            return search;
        };

        const run = async () => {
            // A tick first: StrictMode's replayed effect overtakes this run before it does anything
            await null;
            if (isStale()) return;
            const worker = getWorker();
            // The kept bytes go at once, but the drawn pages stay until new bytes are shown
            setState((prev) => ({
                ...INITIAL,
                status: latched(prev.status, worker.isReady() ? 'rendering' : 'starting'),
            }));
            // Waits for a request an older run left in flight and throws its result away
            await worker.inFlight();
            if (isStale()) return;

            const full = await renderCounted(0);
            if (isStale()) return;
            if (!full) {
                setState((prev) => ({ ...prev, status: latched(prev.status, 'failed') }));
                return;
            }
            const isMultiPage = full.pages > 1;
            setState((prev) => ({
                ...prev,
                full,
                status: latched(prev.status, 'ready'),
                fit: isMultiPage ? 'checking' : 'idle',
            }));
            if (!isMultiPage) return;

            const search = await searchOnePage();
            if (isStale()) return;
            setState((prev) => ({
                ...prev,
                fit: search.fit,
                onePage: search.fit === 'fits' ? search.onePage : null,
            }));
        };

        void run();
        return () => {
            runIdRef.current += 1;
        };
    }, [data, templateId, lang, attempt, createClient, countPages]);

    const onePage = state.mode === 'onePage' ? state.onePage : null;

    return {
        status: state.status,
        fit: state.fit,
        mode: state.mode,
        setMode: (mode) =>
            setState((prev) => (mode === 'onePage' && !prev.onePage ? prev : { ...prev, mode })),
        shown: onePage ?? state.full,
        compactScale: onePage?.scale ?? 0,
        retry: () => setAttempt((count) => count + 1),
    };
};
