import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BuilderPage from '@/features/builder/builder-page';
import longResume from '@/test/fixtures/long-resume.json';
import { renderWithRouter, screen, userEvent } from '@/test/test-utils';

// Spec 0009, AC-1: a keystroke in one card redraws no other card. The real SortableCard and
// FormSectionCard render through plain wrappers that count each render by id and title.
const counts = vi.hoisted(() => ({
    cards: new Map<string, number>(),
    sections: new Map<string, number>(),
}));

const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

vi.mock('@/features/builder/form-sections/sortable-item', async (importActual) => {
    const actual =
        await importActual<typeof import('@/features/builder/form-sections/sortable-item')>();
    const SortableCard = (props: ComponentProps<typeof actual.SortableCard>) => {
        bump(counts.cards, props.id);
        return <actual.SortableCard {...props} />;
    };
    return { ...actual, SortableCard };
});

vi.mock('@/features/builder/form-sections/form-section-card', async (importActual) => {
    const actual =
        await importActual<typeof import('@/features/builder/form-sections/form-section-card')>();
    const FormSectionCard = (props: ComponentProps<typeof actual.FormSectionCard>) => {
        bump(counts.sections, props.title);
        return <actual.FormSectionCard {...props} />;
    };
    return { ...actual, FormSectionCard };
});

const rendered = (map: Map<string, number>) => [...map.entries()].filter(([, n]) => n > 0);

const cases = [
    { list: 'experience', label: 'Position', id: 'experience-2' },
    { list: 'education', label: 'Degree', id: 'education-2' },
    { list: 'languages', label: 'Language', id: 'language-2' },
];

describe('builder render counts', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('resumeData', JSON.stringify(longResume));
    });

    it.each(cases)(
        'should render no other card when typing into $list card 3',
        async ({ label, id }) => {
            const user = userEvent.setup();
            await renderWithRouter(BuilderPage);
            const input = screen.getAllByRole<HTMLInputElement>('textbox', { name: label })[2];
            expect(input).toBeDefined();
            await user.click(input);
            counts.cards.clear();
            counts.sections.clear();

            await user.keyboard('x');

            expect(input.value.endsWith('x')).toBe(true);
            expect(rendered(counts.cards).filter(([key]) => key !== id)).toEqual([]);
            expect(rendered(counts.sections)).toEqual([]);
            expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0);
        },
    );
});
