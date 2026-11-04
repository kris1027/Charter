import { describe, expect, it, vi } from 'vitest';

// Mock pdfjs-dist to avoid worker side-effects
vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn(),
}));

import { contactFromLinkUrls, detectTemplate, parseResumeFromText } from './pdf-parser';

describe('contactFromLinkUrls', () => {
    it('categorizes link-annotation URLs into contact fields', () => {
        const contact = contactFromLinkUrls([
            'https://www.zaruszaj.pl/o-mnie',
            'https://github.com/Kris1027',
            'https://www.linkedin.com/in/krzysztof-obarzanek/',
            'mailto:obarzanek.work@gmail.com',
            'tel:+48 792 542 841',
        ]);
        expect(contact).toEqual({
            website: 'https://www.zaruszaj.pl/o-mnie',
            github: 'https://github.com/Kris1027',
            linkedin: 'https://www.linkedin.com/in/krzysztof-obarzanek',
            email: 'obarzanek.work@gmail.com',
            phone: '+48792542841',
        });
    });

    it('keeps the first URL of each kind and ignores unknown schemes', () => {
        const contact = contactFromLinkUrls([
            'https://example.com',
            'https://other.com',
            'javascript:alert(1)',
        ]);
        expect(contact).toEqual({ website: 'https://example.com' });
    });
});

describe('detectTemplate', () => {
    it('detects developer template by // WORK EXPERIENCE', () => {
        expect(detectTemplate('Some text // WORK EXPERIENCE more text')).toBe('developer');
    });

    it('detects developer template by // TECH STACK', () => {
        expect(detectTemplate('// TECH STACK')).toBe('developer');
    });

    it('detects default template by PROFESSIONAL EXPERIENCE', () => {
        expect(detectTemplate('PROFESSIONAL EXPERIENCE section')).toBe('default');
    });

    it('detects default template by CORE COMPETENCIES', () => {
        expect(detectTemplate('CORE COMPETENCIES')).toBe('default');
    });

    it('detects veterinary template by SPECIAL INTERESTS', () => {
        expect(detectTemplate('SPECIAL INTERESTS in animals')).toBe('veterinary');
    });

    it('defaults to developer when no markers found', () => {
        expect(detectTemplate('Just some random text')).toBe('developer');
    });
});

describe('parseResumeFromText — developer template', () => {
    const developerText = [
        'John Doe',
        'Senior Developer',
        'john@example.com',
        '+48 123 456 789',
        'Warsaw, Poland',
        '// WORK EXPERIENCE',
        'ACME Corp | Frontend Developer',
        'January 2023 - Present | Warsaw',
        '• Built amazing features',
        '• Improved performance',
        '// EDUCATION',
        'Computer Science',
        '2019 - 2023 | MIT',
        '// TECH STACK',
        'TypeScript React Node.js',
        '// LANGUAGES',
        'Polish\tNATIVE',
        'English\tC2',
        '// INTERESTS',
        'Hiking  Photography',
    ].join('\n');

    it('parses personal info', () => {
        const result = parseResumeFromText(developerText, 'developer');
        expect(result.personalInfo.firstName).toBe('John');
        expect(result.personalInfo.lastName).toBe('Doe');
        expect(result.personalInfo.email).toBe('john@example.com');
    });

    it('sets templateId to developer', () => {
        const result = parseResumeFromText(developerText, 'developer');
        expect(result.templateId).toBe('developer');
    });

    it('parses experiences', () => {
        const result = parseResumeFromText(developerText, 'developer');
        expect(result.experiences.length).toBeGreaterThanOrEqual(1);
        expect(result.experiences[0].company).toBe('ACME Corp');
        expect(result.experiences[0].position).toBe('Frontend Developer');
        expect(result.experiences[0].current).toBe(true);
    });

    it('parses skills from TECH STACK', () => {
        const result = parseResumeFromText(developerText, 'developer');
        const skillNames = result.skills.map((s) => s.name);
        expect(skillNames).toContain('TypeScript');
        expect(skillNames).toContain('React');
    });

    it('parses languages with proficiency', () => {
        const result = parseResumeFromText(developerText, 'developer');
        expect(result.languages.length).toBeGreaterThanOrEqual(1);
        const polish = result.languages.find((l) => l.language === 'Polish');
        expect(polish?.proficiency).toBe('NATIVE');
    });

    it('parses interests', () => {
        const result = parseResumeFromText(developerText, 'developer');
        const interestNames = result.interests.map((i) => i.name);
        expect(interestNames).toContain('Hiking');
    });
});

describe('parseResumeFromText — default template', () => {
    const defaultText = [
        'Jane Smith',
        'Product Manager',
        'jane@company.com',
        'PROFESSIONAL EXPERIENCE',
        'BigCo | Product Lead',
        'March 2022 - December 2023',
        '• Led product strategy',
        'EDUCATION',
        'MBA in Business Administration',
        '2018 - 2020 | Harvard',
        'CORE COMPETENCIES',
        'Leadership Strategy',
        'LANGUAGES',
        'English\tNATIVE',
        'INTERESTS',
        'Reading',
    ].join('\n');

    it('parses with templateId default', () => {
        const result = parseResumeFromText(defaultText, 'default');
        expect(result.templateId).toBe('default');
    });

    it('parses personal info', () => {
        const result = parseResumeFromText(defaultText, 'default');
        expect(result.personalInfo.firstName).toBe('Jane');
        expect(result.personalInfo.lastName).toBe('Smith');
    });

    it('parses Core Competencies as skills', () => {
        const result = parseResumeFromText(defaultText, 'default');
        const skillNames = result.skills.map((s) => s.name);
        expect(skillNames).toContain('Leadership');
    });
});

describe('parseResumeFromText — veterinary template', () => {
    const vetText = [
        'Anna Kowalska',
        'Veterinarian',
        'anna@vet.com',
        'Work Experience',
        'Happy Pets Clinic | Vet Surgeon',
        'June 2021 - Present',
        '• Performed surgeries',
        'EDUCATION',
        'Veterinary Medicine',
        '2015 - 2021 | Warsaw University',
        'SKILLS',
        'Surgery Diagnostics',
        'LANGUAGES',
        'Polish\tNATIVE',
        'SPECIAL INTERESTS',
        'Animal welfare',
    ].join('\n');

    it('parses with templateId veterinary', () => {
        const result = parseResumeFromText(vetText, 'veterinary');
        expect(result.templateId).toBe('veterinary');
    });

    it('parses personal info', () => {
        const result = parseResumeFromText(vetText, 'veterinary');
        expect(result.personalInfo.firstName).toBe('Anna');
        expect(result.personalInfo.lastName).toBe('Kowalska');
    });

    it('parses skills section', () => {
        const result = parseResumeFromText(vetText, 'veterinary');
        const skillNames = result.skills.map((s) => s.name);
        expect(skillNames).toContain('Surgery');
    });
});

describe('parseResumeFromText — real-world PDF reconstruction quirks', () => {
    // Lines as produced by reconstructing a real app-exported developer PDF:
    // single-space separators, diacritics, an institution containing " in ", and
    // a trailing GDPR consent clause.
    const text = [
        'Krzysztof Obarzanek',
        'Frontend Developer',
        'Kraków, Poland obarzanek.work@gmail.com +48 792 542 841',
        '// WORK EXPERIENCE',
        'M8B | Frontend Developer',
        'February 2025 - February 2026 | Katowice, Poland',
        '• Built things',
        '// EDUCATION',
        'Computer Science',
        'University of DSW Ideis in Cracow',
        '2026 - 2030',
        '// TECH STACK',
        'React TypeScript',
        '// LANGUAGES',
        'Polish NATIVE',
        'English B2',
        '// INTERESTS',
        'Running',
        'I hereby give my consent for my personal data to be processed',
        'in accordance with Regulation (EU) 2016/679 (GDPR).',
    ].join('\n');

    it('parses location with diacritics', () => {
        const result = parseResumeFromText(text, 'developer');
        expect(result.personalInfo.location).toBe('Kraków, Poland');
    });

    it('keeps a single education entry when the institution contains " in "', () => {
        const result = parseResumeFromText(text, 'developer');
        expect(result.education).toHaveLength(1);
        expect(result.education[0].field).toBe('Computer Science');
        expect(result.education[0].institution).toBe('University of DSW Ideis in Cracow');
        expect(result.education[0].startDate).toBe('2026-01');
    });

    it('parses single-space "language LEVEL" lines for every level', () => {
        const result = parseResumeFromText(text, 'developer');
        expect(result.languages).toEqual([
            { language: 'Polish', proficiency: 'NATIVE' },
            { language: 'English', proficiency: 'B2' },
        ]);
    });

    it('excludes the GDPR consent clause from interests', () => {
        const result = parseResumeFromText(text, 'developer');
        const names = result.interests.map((i) => i.name.toLowerCase());
        expect(result.interests.some((i) => /consent|gdpr|regulation/i.test(i.name))).toBe(false);
        expect(names).toContain('running');
    });
});

describe('parseResumeFromText — native language label', () => {
    const textWith = (languageLine: string) =>
        [
            'Jan Kowalski',
            'Frontend Developer',
            'jan@example.com',
            '// LANGUAGES',
            languageLine,
            'English B2',
        ].join('\n');

    it.each(['Polski Ojczysty', 'Polish Native', 'Polish NATIVE'])(
        'should read the level as NATIVE when the PDF prints "%s"',
        (line) => {
            const result = parseResumeFromText(textWith(line), 'developer');
            const native = result.languages.find((l) => l.language.startsWith('Pol'));
            expect(native?.proficiency).toBe('NATIVE');
        },
    );
});

describe('parseResumeFromText — Polish exports', () => {
    // Synthetic text like the cases above: headers as each template prints them in Polish
    const polishText = (headers: string[]) =>
        [
            'Anna Kowalska',
            'Inżynier oprogramowania',
            'Kraków anna@example.com +48 600 100 200',
            headers[0],
            'TechPol | Senior Developer',
            'March 2022 - Present | Kraków',
            '• Prowadzenie zespołu',
            headers[1],
            'Informatyka',
            'Magister - Politechnika Krakowska',
            '2014 - 2019',
            headers[2],
            'TypeScript React',
            headers[3],
            'Polski Ojczysty',
            headers[4],
            'Szachy',
        ].join('\n');

    const developerText = polishText([
        '// DOŚWIADCZENIE ZAWODOWE',
        '// WYKSZTAŁCENIE',
        '// TECHNOLOGIE',
        '// JĘZYKI',
        '// ZAINTERESOWANIA',
    ]);
    const defaultText = polishText([
        'DOŚWIADCZENIE ZAWODOWE',
        'WYKSZTAŁCENIE',
        'KLUCZOWE KOMPETENCJE',
        'JĘZYKI',
        'ZAINTERESOWANIA',
    ]);
    const veterinaryText = polishText([
        'Doświadczenie zawodowe',
        'Wykształcenie',
        'Umiejętności',
        'Języki',
        'ZAINTERESOWANIA',
    ]);

    it('should detect each template when the export is in Polish', () => {
        expect(detectTemplate(developerText)).toBe('developer');
        expect(detectTemplate(defaultText)).toBe('default');
        expect(detectTemplate(veterinaryText)).toBe('veterinary');
    });

    it('should find the experience section when the export is in Polish', () => {
        for (const [text, templateId] of [
            [developerText, 'developer'],
            [defaultText, 'default'],
            [veterinaryText, 'veterinary'],
        ] as const) {
            expect(parseResumeFromText(text, templateId).experiences.length).toBeGreaterThan(0);
        }
    });
});
