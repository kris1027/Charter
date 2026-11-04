import { describe, expect, it } from 'vitest';

import type { ResumeData } from '@/features/resume/form-types';
import { sampleResumeData } from '@/features/resume/sample-resume-data';
import { buildResumeView, parseDescriptionLines } from './resume-view';

const withInfo = (info: Partial<ResumeData['personalInfo']>): ResumeData => ({
    ...sampleResumeData,
    personalInfo: { ...sampleResumeData.personalInfo, ...info },
});

const kinds = (data: ResumeData, templateId: 'developer' | 'default' | 'veterinary') =>
    buildResumeView(templateId, data, 'en').contactRows.map((row) => row.map((c) => c.kind));

describe('buildResumeView', () => {
    it('should give developer titles, long dates and two contact rows when built from the sample', () => {
        const view = buildResumeView('developer', sampleResumeData, 'en');

        expect(view.sections.experience.title).toBe('// WORK EXPERIENCE');
        expect(view.sections.skills.title).toBe('// TECH STACK');
        expect(view.sections.experience.items[0]).toMatchObject({
            start: 'March 2022',
            end: 'Present',
        });
        expect(kinds(sampleResumeData, 'developer')).toEqual([
            ['website', 'github', 'linkedin'],
            ['location', 'email', 'phone'],
        ]);
    });

    it('should leave GitHub out when the default layout has GitHub filled', () => {
        expect(kinds(sampleResumeData, 'default')).toEqual([
            ['location', 'email', 'phone', 'linkedin', 'website'],
        ]);
    });

    it('should keep the website raw for default and short for developer when it has a protocol', () => {
        const data = withInfo({ website: 'https://x.dev/' });
        const website = (id: 'developer' | 'default') =>
            buildResumeView(id, data, 'en')
                .contactRows.flat()
                .find((c) => c.kind === 'website');

        expect(website('default')).toEqual({
            kind: 'website',
            text: 'https://x.dev/',
            href: 'https://x.dev/',
        });
        expect(website('developer')).toEqual({
            kind: 'website',
            text: 'x.dev',
            href: 'https://x.dev/',
        });
    });

    it('should link email and phone and leave location unlinked when they are filled', () => {
        const items = buildResumeView('default', sampleResumeData, 'en').contactRows.flat();
        const { email, phone, location } = sampleResumeData.personalInfo;

        expect(items.find((c) => c.kind === 'email')?.href).toBe(`mailto:${email}`);
        expect(items.find((c) => c.kind === 'phone')?.href).toBe(`tel:${phone}`);
        expect(items.find((c) => c.kind === 'location')).toEqual({
            kind: 'location',
            text: location,
            href: null,
        });
    });

    it('should drop an item when its field is empty and a row when every field in it is empty', () => {
        expect(kinds(withInfo({ phone: '' }), 'veterinary')).toEqual([
            ['location', 'email', 'linkedin', 'website'],
        ]);
        expect(kinds(withInfo({ website: '', github: '', linkedin: '' }), 'developer')).toEqual([
            ['location', 'email', 'phone'],
        ]);
    });

    it('should print present and native in the resume language when the job is current', () => {
        const data: ResumeData = {
            ...sampleResumeData,
            experiences: [
                { ...sampleResumeData.experiences[0], current: true, endDate: '2020-01' },
            ],
            languages: [
                { language: 'Polish', proficiency: 'NATIVE' },
                { language: 'German', proficiency: 'B2' },
            ],
        };
        const en = buildResumeView('default', data, 'en');
        const pl = buildResumeView('default', data, 'pl');

        expect(en.sections.experience.items[0].end).toBe('Present');
        expect(pl.sections.experience.items[0].end).toBe('Obecnie');
        expect(en.sections.languages.items.map((l) => l.level)).toEqual(['Native', 'B2']);
        expect(pl.sections.languages.items[0].level).toBe('Ojczysty');
    });

    it('should give short dates and years when the layout is default', () => {
        const view = buildResumeView('default', sampleResumeData, 'en');
        const edu = sampleResumeData.education[0];

        expect(view.sections.experience.items[0].start).toBe('Mar 2022');
        expect(view.sections.education.items[0]).toMatchObject({
            startYear: edu.startDate.slice(0, 4),
            endYear: edu.endDate.slice(0, 4),
        });
    });

    it('should return no GDPR text when consent is off and the right text when it is on', () => {
        const gdpr = (enabled: boolean, companyName: string) =>
            buildResumeView(
                'default',
                { ...sampleResumeData, gdprConsent: { enabled, companyName } },
                'en',
            ).gdpr;

        expect(gdpr(false, 'ACME')).toBeNull();
        expect(gdpr(true, '  ')).toMatch(/^I hereby give my consent .* recruitment process in/);
        expect(gdpr(true, 'ACME')).toContain('conducted by ACME');
    });

    it('should keep every list entry in order when names are blank', () => {
        const data: ResumeData = { ...sampleResumeData, skills: [{ name: '' }, { name: 'Go' }] };

        expect(buildResumeView('developer', data, 'en').sections.skills.items).toEqual(['', 'Go']);
    });
});

describe('parseDescriptionLines', () => {
    it('should strip markers and drop empty lines when given a bullet list', () => {
        expect(parseDescriptionLines('• one\n\n- two\n  *three')).toEqual(['one', 'two', 'three']);
    });
});
