import { useEffect, useRef, useState, type RefObject } from 'react';
import {
    BUILDER_SECTION_IDS,
    sectionAnchor,
    type BuilderSectionId,
} from '@/features/builder/builder-sections';

// After a link is activated, its section stays active until scrolling has been quiet this long
const ARRIVAL_HOLD_MS = 150;

const FIRST = BUILDER_SECTION_IDS[0];
const LAST = BUILDER_SECTION_IDS[BUILDER_SECTION_IDS.length - 1];

type HoldTimer = { current: number | undefined };

// Starts the hold, or pushes its end back when it is already running
const startHold = (timer: HoldTimer) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
        timer.current = undefined;
    }, ARRIVAL_HOLD_MS);
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The last section whose top has reached the page's scroll-padding-top; the first before any
// has, and the last at the bottom of the page (spec 0012, AC-15)
const findActiveSection = (): BuilderSectionId => {
    const root = document.documentElement;
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= root.scrollHeight - 2) {
        return LAST;
    }
    const line = (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 1;
    let active: BuilderSectionId = FIRST;
    for (const id of BUILDER_SECTION_IDS) {
        const section = document.getElementById(sectionAnchor(id));
        if (section && section.getBoundingClientRect().top <= line) active = id;
    }
    return active;
};

// Which section the strip marks as current. A passive scroll listener runs at most once per
// frame; the state lives in the strip, so the form never redraws for it
export const useActiveSection = (listRef: RefObject<HTMLElement | null>) => {
    const [activeId, setActiveId] = useState<BuilderSectionId>(FIRST);
    const holdTimer = useRef<number | undefined>(undefined);

    useEffect(() => {
        // The timer object, not a node: the cleanup must clear whatever hold is running then
        const timer = holdTimer;
        let frame = 0;
        const update = () => {
            frame = 0;
            // A link just activated keeps its section until the hold ends
            if (timer.current !== undefined) return;
            setActiveId(findActiveSection());
        };
        const handleScroll = () => {
            // While holding, each scroll event pushes the end of the hold back
            if (timer.current !== undefined) return startHold(timer);
            if (!frame) frame = requestAnimationFrame(update);
        };

        frame = requestAnimationFrame(update);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(frame);
            window.clearTimeout(timer.current);
        };
    }, []);

    // Keep the active link in view by scrolling only the strip, never the page
    useEffect(() => {
        const list = listRef.current;
        const link = list?.querySelector<HTMLElement>(`[data-section-link='${activeId}']`);
        if (!list || !link) return;
        const start = link.offsetLeft;
        const end = start + link.offsetWidth;
        if (start >= list.scrollLeft && end <= list.scrollLeft + list.clientWidth) return;
        list.scrollTo?.({
            left: start - list.clientWidth / 2 + link.offsetWidth / 2,
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
    }, [activeId, listRef]);

    // Scrolls to the section and focuses its h2 without cancelling that scroll (AC-14)
    const activate = (id: BuilderSectionId) => {
        const section = document.getElementById(sectionAnchor(id));
        if (!section) return;
        section.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start',
        });
        section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
        setActiveId(id);
        startHold(holdTimer);
    };

    return { activeId, activate };
};
