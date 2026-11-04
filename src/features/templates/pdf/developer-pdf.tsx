import '@/features/templates/pdf/pdf-fonts';
import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/features/resume/form-types';
import { formatWebsiteDisplay, formatGithubDisplay, formatLinkedinDisplay } from '@/lib/utils';
import { formatCVDate, formatCVYear } from '@/lib/date-format';
import type { AppLang } from '@/lib/app-lang';
import { getPDFStrings } from '@/features/templates/model/template-strings';
import { buildResumeMetadata } from '@/features/resume/resume-metadata';
import {
    GlobeIcon,
    GithubIcon,
    LinkedinIcon,
    MapPinIcon,
    MailIcon,
    PhoneIcon,
} from '@/features/templates/pdf/pdf-icons';

interface DeveloperPDFProps {
    data: ResumeData;
    compactScale?: number; // 0 = normal, 1 = maximum compact
    lang?: AppLang;
}

const C = {
    purple: '#7C3AED',
    white: '#FFFFFF',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray900: '#111827',
    green400: '#4ADE80',
    cyan500: '#06B6D4',
} as const;

// Interpolate between normal and max-compact values
const lerp = (normal: number, min: number, t: number) =>
    Math.round((normal + (min - normal) * t) * 10) / 10;

function createStyles(t: number) {
    const s = (n: number, m: number) => lerp(n, m, t);
    return StyleSheet.create({
        page: {
            fontFamily: 'Fira Code',
            backgroundColor: C.white,
            fontSize: 10,
            color: C.gray800,
            paddingTop: s(20, 8),
        },
        header: {
            backgroundColor: C.purple,
            paddingTop: s(4, 2),
            paddingHorizontal: s(24, 14),
            paddingBottom: s(24, 10),
            color: C.white,
        },
        headerName: {
            fontSize: s(24, 16),
            fontFamily: 'Fira Code',
            fontWeight: 700,
            marginBottom: s(4, 1),
        },
        headerTitle: { fontSize: s(13, 10), marginBottom: s(10, 4) },
        headerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(16, 8), marginTop: s(4, 1) },
        contactItem: { flexDirection: 'row', alignItems: 'center', gap: s(4, 2) },
        headerLink: { color: C.white, fontSize: s(9, 8), textDecoration: 'none' },
        body: { flexDirection: 'column', padding: s(20, 10) },
        section: { marginBottom: s(16, 6) },
        sectionHeader: {
            fontSize: s(11, 8),
            fontFamily: 'Fira Code',
            fontWeight: 700,
            color: C.purple,
            borderBottomWidth: 1.5,
            borderBottomColor: C.purple,
            paddingBottom: s(3, 1),
            marginBottom: s(8, 3),
        },
        expBlock: { marginBottom: s(10, 4) },
        expTitle: { fontSize: s(11, 8), fontFamily: 'Fira Code', fontWeight: 700 },
        expPurple: { color: C.purple },
        expMeta: { fontSize: s(9, 7), color: C.gray600, marginBottom: s(3, 1) },
        bulletRow: { flexDirection: 'row', marginBottom: s(2, 0.5) },
        bulletDot: { width: 10, fontSize: s(9, 7), color: C.gray700 },
        bulletText: { flex: 1, fontSize: s(9, 7), color: C.gray700, lineHeight: s(1.4, 1.2) },
        eduBlock: { marginBottom: s(8, 3) },
        eduField: { fontSize: s(10, 8), fontFamily: 'Fira Code', fontWeight: 700, color: C.purple },
        eduMeta: { fontSize: s(9, 7), color: C.gray700 },
        skillsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
        skillTag: {
            backgroundColor: C.gray900,
            color: C.green400,
            borderWidth: 1,
            borderColor: C.gray700,
            borderRadius: 3,
            paddingHorizontal: s(6, 3),
            paddingVertical: s(2, 1),
            fontSize: s(8, 6),
            marginRight: s(4, 2),
            marginBottom: s(4, 2),
        },
        langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(4, 1) },
        langName: { fontFamily: 'Fira Code', fontWeight: 700, fontSize: s(9, 7) },
        langLevel: { color: C.purple, fontSize: s(9, 7) },
        interestsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
        interestTag: {
            backgroundColor: C.cyan500,
            color: C.white,
            borderRadius: 10,
            paddingHorizontal: s(8, 4),
            paddingVertical: s(3, 1),
            fontSize: s(8, 6),
            marginRight: s(4, 2),
            marginBottom: s(4, 2),
        },
        gdpr: {
            fontSize: s(7, 6),
            color: '#9CA3AF',
            marginTop: s(12, 4),
            borderTopWidth: 0.5,
            borderTopColor: '#E5E7EB',
            paddingTop: s(6, 3),
            paddingHorizontal: s(20, 10),
            paddingBottom: s(20, 10),
        },
    });
}

function parseDescriptionLines(description: string): string[] {
    return description
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => l.replace(/^[-*•‣◦⁃∙]\s*/, ''));
}

export function DeveloperPDF({ data, compactScale = 0, lang = 'en' }: DeveloperPDFProps) {
    const styles = createStyles(compactScale);
    const iconSize = lerp(9, 8, compactScale);
    const str = getPDFStrings(lang);
    const {
        personalInfo: p,
        experiences,
        education,
        skills,
        languages,
        interests,
        gdprConsent,
    } = data;

    const gdprText = gdprConsent?.companyName?.trim()
        ? str.gdprConsent(gdprConsent.companyName)
        : str.gdprConsentGeneric;

    return (
        <Document
            title={`${p.firstName} ${p.lastName} - Resume`}
            author={`${p.firstName} ${p.lastName}`}
            subject='Professional Resume'
            keywords={skills.map((s) => s.name).join(', ')}
            creator={buildResumeMetadata('developer', data)}
            language={lang}
        >
            <Page size='A4' style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerName}>
                        {p.firstName} {p.lastName}
                    </Text>
                    {p.title ? <Text style={styles.headerTitle}>{p.title}</Text> : null}
                    <View style={styles.headerRow}>
                        {p.website ? (
                            <View style={styles.contactItem}>
                                <GlobeIcon size={iconSize} color={C.white} />
                                <Link src={p.website} style={styles.headerLink}>
                                    {formatWebsiteDisplay(p.website)}
                                </Link>
                            </View>
                        ) : null}
                        {p.github ? (
                            <View style={styles.contactItem}>
                                <GithubIcon size={iconSize} color={C.white} />
                                <Link src={p.github} style={styles.headerLink}>
                                    {formatGithubDisplay(p.github)}
                                </Link>
                            </View>
                        ) : null}
                        {p.linkedin ? (
                            <View style={styles.contactItem}>
                                <LinkedinIcon size={iconSize} color={C.white} />
                                <Link src={p.linkedin} style={styles.headerLink}>
                                    {formatLinkedinDisplay(p.linkedin)}
                                </Link>
                            </View>
                        ) : null}
                    </View>
                    <View style={styles.headerRow}>
                        {p.location ? (
                            <View style={styles.contactItem}>
                                <MapPinIcon size={iconSize} color={C.white} />
                                <Text style={styles.headerLink}>{p.location}</Text>
                            </View>
                        ) : null}
                        {p.email ? (
                            <View style={styles.contactItem}>
                                <MailIcon size={iconSize} color={C.white} />
                                <Link src={`mailto:${p.email}`} style={styles.headerLink}>
                                    {p.email}
                                </Link>
                            </View>
                        ) : null}
                        {p.phone ? (
                            <View style={styles.contactItem}>
                                <PhoneIcon size={iconSize} color={C.white} />
                                <Link src={`tel:${p.phone}`} style={styles.headerLink}>
                                    {p.phone}
                                </Link>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View style={styles.body}>
                    {experiences.length > 0 && (
                        <View style={styles.section}>
                            <Text
                                style={styles.sectionHeader}
                            >{`// ${str.workExperience.toUpperCase()}`}</Text>
                            {experiences.map((exp, i) => (
                                <View key={i} style={styles.expBlock} wrap={false}>
                                    <Text style={styles.expTitle}>
                                        {exp.company}
                                        <Text style={styles.expPurple}>
                                            {' | '}
                                            {exp.position}
                                        </Text>
                                    </Text>
                                    <Text style={styles.expMeta}>
                                        {formatCVDate(exp.startDate, lang)} -{' '}
                                        {exp.current
                                            ? str.present
                                            : formatCVDate(exp.endDate, lang)}
                                        {exp.location ? ` | ${exp.location}` : ''}
                                    </Text>
                                    {parseDescriptionLines(exp.description).map((line, j) => (
                                        <View key={j} style={styles.bulletRow}>
                                            <Text style={styles.bulletDot}>{'• '}</Text>
                                            <Text style={styles.bulletText}>{line}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    )}

                    {education.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text
                                style={styles.sectionHeader}
                            >{`// ${str.education.toUpperCase()}`}</Text>
                            {education.map((edu, i) => (
                                <View key={i} style={styles.eduBlock} wrap={false}>
                                    <Text style={styles.eduField}>{edu.field}</Text>
                                    <Text style={styles.eduMeta}>
                                        {edu.degree}
                                        {edu.degree && edu.institution ? ' - ' : ''}
                                        {edu.institution}
                                    </Text>
                                    <Text style={styles.eduMeta}>
                                        {formatCVYear(edu.startDate)} - {formatCVYear(edu.endDate)}
                                    </Text>
                                    {edu.description ? (
                                        <Text style={styles.bulletText}>{edu.description}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {skills.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text
                                style={styles.sectionHeader}
                            >{`// ${str.techStack.toUpperCase()}`}</Text>
                            <View style={styles.skillsWrap}>
                                {skills.map((s, i) => (
                                    <Text key={i} style={styles.skillTag}>
                                        {s.name}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    )}

                    {languages.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text
                                style={styles.sectionHeader}
                            >{`// ${str.languages.toUpperCase()}`}</Text>
                            {languages.map((l, i) => (
                                <View key={i} style={styles.langRow}>
                                    <Text style={styles.langName}>{l.language}</Text>
                                    <Text style={styles.langLevel}>
                                        {l.proficiency === 'NATIVE' ? str.native : l.proficiency}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {interests.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text
                                style={styles.sectionHeader}
                            >{`// ${str.interests.toUpperCase()}`}</Text>
                            <View style={styles.interestsWrap}>
                                {interests.map((interest, i) => (
                                    <Text key={i} style={styles.interestTag}>
                                        {interest.name}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {gdprConsent?.enabled ? <Text style={styles.gdpr}>{gdprText}</Text> : null}
            </Page>
        </Document>
    );
}
