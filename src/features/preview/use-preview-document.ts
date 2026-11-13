import { useEffect, useRef, useState } from 'react';
import {
    createPreviewClient,
    type PreviewClient,
    type PreviewResult,
} from '@/features/pdf/live-preview/preview-client';
import { countPdfBytes } from '@/features/pdf/pdf-export';
import {
    findOnePageScale,
    type OnePageFit,
    type Trial,
} from '@/features/preview/find-one-page-scale';
import type { ResumeData } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';

export const FIT_SEARCH_CAP_MS = 60_000;

export type PreviewMode = 'full' | 'onePage';
export type PreviewStatus = 'starting' | 'rendering' | 'ready' | 'failed' | 'unavailable';
export type PreviewFit = 'idle' | 'checking' | 'fits' | 'too-long' | 'failed';

export type PreviewDocument = {
    status: PreviewStatus;
    fit: PreviewFit;
    mode: PreviewMode;
    setMode: (mode: PreviewMode) => void;
    // The kept bytes for the selected mode
    shown: Trial | null;
    // 0 for full, the winning scale for onePage
    scale: number;
    retry: () => void;
};

type UsePreviewDocumentOptions = {
    data: ResumeData;
    templateId: TemplateId;
    lang: AppLang;
    // Both must keep their identity between renders: a new one starts a new run
    createClient?: () => PreviewClient;
    countPages?: (pdf: ArrayBuffer) => Promise<number | null>;
};

type State = {
    status: PreviewStatus;
    fit: PreviewFit;
    mode: PreviewMode;
    full: Trial | null;
    onePage: OnePageFit | null;
};

const INITIAL: State = { status: 'starting', fit: 'idle', mode: 'full', full: null, onePage: null };
const FAILED: PreviewResult = { ok: false };

// The /preview engine (spec 0013): renders the saved resume in the preview worker at full size,
// then searches for the scale that fits one page, keeping the bytes of both versions.
// Only one worker request is ever outstanding: the client has one waiting slot and one result
// callback with no request id, so two requests in flight could swap their answers.
export const usePreviewDocument = ({
    data,
    templateId,
    lang,
    createClient = createPreviewClient,
    countPages = countPdfBytes,
}: UsePreviewDocumentOptions): PreviewDocument => {
    const clientRef = useRef<PreviewClient | null>(null);
    const disposeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const waiterRef = useRef<((result: PreviewResult) => void) | null>(null);
    const inFlightRef = useRef<Promise<PreviewResult> | null>(null);
    const unavailableRef = useRef(false);
    const disposedRef = useRef(false);
    const workerReadyRef = useRef(false);
    const runIdRef = useRef(0);
    const [state, setState] = useState(INITIAL);
    const [attempt, setAttempt] = useState(0);

    // Disposed when the page unmounts. The dispose waits a tick, so StrictMode's effect replay
    // in development keeps the one worker instead of starting a second
    useEffect(() => {
        clearTimeout(disposeTimerRef.current);
        disposedRef.current = false;
        return () => {
            disposeTimerRef.current = setTimeout(() => {
                disposedRef.current = true;
                const waiter = waiterRef.current;
                waiterRef.current = null;
                inFlightRef.current = null;
                waiter?.(FAILED);
                clientRef.current?.dispose();
                clientRef.current = null;
            }, 0);
        };
    }, []);

    // One run: the full size render, then the fit search. A language change or Try again starts
    // a new run; the run id makes an overtaken run stop without touching state (AC-18)
    useEffect(() => {
        const runId = ++runIdRef.current;
        const isStale = () => runId !== runIdRef.current;

        // A result with nothing waiting (a late answer after a timeout) is dropped here
        const settle = (result: PreviewResult) => {
            const waiter = waiterRef.current;
            waiterRef.current = null;
            inFlightRef.current = null;
            waiter?.(result);
        };

        const getClient = () => {
            if (clientRef.current) return clientRef.current;
            const client = createClient();
            client.onResult(settle);
            client.onStatus((status) => {
                if (status === 'unavailable') {
                    // Latched until reload, even if a late ready follows. The pages and their
                    // kept bytes stay; only the switch is dropped (AC-22)
                    unavailableRef.current = true;
                    setState((prev) => ({
                        ...prev,
                        status: 'unavailable',
                        fit: prev.fit === 'fits' ? 'failed' : prev.fit,
                    }));
                    settle(FAILED);
                    return;
                }
                if (status === 'starting') return;
                workerReadyRef.current = true;
                setState((prev) =>
                    prev.status === 'starting' ? { ...prev, status: 'rendering' } : prev,
                );
            });
            clientRef.current = client;
            return client;
        };

        const renderOnce = (compactScale: number): Promise<PreviewResult> => {
            if (unavailableRef.current || disposedRef.current) return Promise.resolve(FAILED);
            const result = new Promise<PreviewResult>((resolve) => {
                waiterRef.current = resolve;
            });
            inFlightRef.current = result;
            getClient().request({ data, templateId, compactScale, lang });
            return result;
        };

        // null on a failed render, or on a page count that errors or comes back 0
        const renderCounted = async (compactScale: number): Promise<Trial | null> => {
            const result = await renderOnce(compactScale);
            if (!result.ok) return null;
            const pages = await countPages(result.pdf).catch(() => null);
            return pages ? { pdf: result.pdf, pages } : null;
        };

        // Trials are never drawn; past the cap, or once overtaken, no further trial is sent
        const searchOnePage = async () => {
            let capped = false;
            let capTimer: ReturnType<typeof setTimeout> | undefined;
            const cap = new Promise<null>((resolve) => {
                capTimer = setTimeout(() => {
                    capped = true;
                    resolve(null);
                }, FIT_SEARCH_CAP_MS);
            });
            const fit = await Promise.race([
                findOnePageScale(async (scale) =>
                    capped || isStale() ? null : renderCounted(scale),
                ),
                cap,
            ]);
            clearTimeout(capTimer);
            return fit;
        };

        const run = async () => {
            // A tick first: StrictMode's replayed effect overtakes this run before it does anything
            await null;
            if (isStale()) return;
            // The kept bytes go at once, but the drawn pages stay until new bytes are shown
            setState((prev) => ({
                ...INITIAL,
                status:
                    prev.status === 'unavailable'
                        ? 'unavailable'
                        : workerReadyRef.current
                          ? 'rendering'
                          : 'starting',
            }));
            // Waits for a request an older run left in flight and throws its result away
            await inFlightRef.current;
            if (isStale()) return;

            const full = await renderCounted(0);
            if (isStale()) return;
            if (!full) {
                setState((prev) =>
                    prev.status === 'unavailable' ? prev : { ...prev, status: 'failed' },
                );
                return;
            }
            const isMultiPage = full.pages > 1;
            setState((prev) => ({
                ...prev,
                full,
                status: prev.status === 'unavailable' ? 'unavailable' : 'ready',
                fit: isMultiPage ? 'checking' : 'idle',
            }));
            if (!isMultiPage) return;

            const fit = await searchOnePage();
            if (isStale()) return;
            setState((prev) => {
                if (fit === null) return { ...prev, fit: 'failed' };
                if (fit === 'too-long') return { ...prev, fit: 'too-long' };
                return { ...prev, fit: 'fits', onePage: fit };
            });
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
        scale: onePage?.scale ?? 0,
        retry: () => setAttempt((count) => count + 1),
    };
};
