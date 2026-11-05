import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
    createPreviewClient,
    type PreviewClient,
    type PreviewClientStatus,
} from '@/features/pdf/live-preview/preview-client';
import { toPreviewInput } from '@/features/pdf/live-preview/preview-protocol';
import type { ResumeFormValues } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';

export const LIVE_PREVIEW_DEBOUNCE_MS = 700;

// The slice of the form store the preview reads, so tests can pass a plain store
export type PreviewFormStore = {
    store: {
        state: { values: ResumeFormValues };
        subscribe: (listener: () => void) => { unsubscribe: () => void };
    };
};

export type LivePreviewStatus = PreviewClientStatus;

export type LivePreview = {
    status: LivePreviewStatus;
    pdf: ArrayBuffer | null;
    failed: boolean;
};

type UseLivePreviewOptions = {
    form: PreviewFormStore;
    templateId: TemplateId;
    lang: AppLang;
    active: boolean;
    createClient?: () => PreviewClient;
};

// Renders the form values to PDF bytes in the preview worker while active (spec 0009).
// It reads the store imperatively, so a keystroke causes no React render here.
export const useLivePreview = ({
    form,
    templateId,
    lang,
    active,
    createClient = createPreviewClient,
}: UseLivePreviewOptions): LivePreview => {
    const clientRef = useRef<PreviewClient | null>(null);
    const disposeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const keyRef = useRef(`${templateId}:${lang}`);
    const [status, setStatus] = useState<PreviewClientStatus>('starting');
    const [pdf, setPdf] = useState<ArrayBuffer | null>(null);
    const [failed, setFailed] = useState(false);

    const getClient = () => {
        if (clientRef.current) return clientRef.current;
        const client = createClient();
        client.onStatus(setStatus);
        client.onResult((result) => {
            if (result.ok) {
                setPdf(result.pdf);
                setFailed(false);
            } else {
                setFailed(true);
            }
        });
        clientRef.current = client;
        return client;
    };

    // The values go as they are: the preview shows what is typed, valid or not
    const requestNow = useEffectEvent(() => {
        clearTimeout(debounceRef.current);
        getClient().request(toPreviewInput(form.store.state.values, lang));
    });

    const requestLater = useEffectEvent(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(requestNow, LIVE_PREVIEW_DEBOUNCE_MS);
    });

    useEffect(() => {
        if (!active) return;
        requestNow();
        let lastValues = form.store.state.values;
        // Touched, blur and error updates keep the same values object, so they start no wait
        const subscription = form.store.subscribe(() => {
            const { values } = form.store.state;
            if (values === lastValues) return;
            lastValues = values;
            requestLater();
        });
        return () => {
            subscription.unsubscribe();
            clearTimeout(debounceRef.current);
        };
    }, [active, form]);

    useEffect(() => {
        const key = `${templateId}:${lang}`;
        if (keyRef.current === key) return;
        keyRef.current = key;
        if (active) requestLater();
    }, [templateId, lang, active]);

    // Disposed when the builder unmounts. The dispose waits a tick, so StrictMode's effect
    // replay in development keeps the one worker instead of starting a second
    useEffect(() => {
        clearTimeout(disposeTimerRef.current);
        return () => {
            disposeTimerRef.current = setTimeout(() => {
                clientRef.current?.dispose();
                clientRef.current = null;
            }, 0);
        };
    }, []);

    return { status, pdf, failed };
};
