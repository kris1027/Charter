import '@/features/templates/pdf/pdf-fonts';
import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/features/resume/form-types';
import { formatLinkedinDisplay } from '@/lib/utils';
import { formatCVDateShort, formatCVYear } from '@/lib/date-format';
import type { AppLang } from '@/lib/app-lang';
import { getPDFStrings } from '@/features/templates/model/template-strings';
import { buildResumeMetadata } from '@/features/resume/resume-metadata';
import {
    GlobeIcon,
    LinkedinIcon,
    MapPinIcon,
    MailIcon,
    PhoneIcon,
} from '@/features/templates/pdf/pdf-icons';

interface VeterinaryPDFProps {
    data: ResumeData;
    compactScale?: number; // 0 = normal, 1 = maximum compact
    lang?: AppLang;
}

const C = {
    white: '#FFFFFF',
    emerald600: '#059669',
    emerald700: '#047857',
    emerald800: '#065F46',
    emerald50: '#ECFDF5',
    emerald100: '#D1FAE5',
    emerald200: '#A7F3D0',
    teal600: '#0D9488',
    teal50: '#F0FDFA',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray500: '#6B7280',
    gray200: '#E5E7EB',
} as const;

const lerp = (normal: number, min: number, t: number) =>
    Math.round((normal + (min - normal) * t) * 10) / 10;

function createStyles(t: number) {
    const s = (n: number, m: number) => lerp(n, m, t);
    return StyleSheet.create({
        page: {
            fontFamily: 'Lato',
            backgroundColor: C.white,
            fontSize: 10,
            color: C.gray800,
            paddingTop: s(20, 8),
        },
        header: {
            backgroundColor: C.emerald50,
            borderBottomWidth: 2,
            borderBottomColor: C.emerald600,
            paddingHorizontal: s(24, 14),
            paddingTop: 0,
            paddingBottom: s(16, 6),
        },
        headerName: {
            fontFamily: 'Merriweather',
            fontWeight: 700,
            fontSize: s(22, 15),
            color: C.gray800,
            textAlign: 'center',
            marginBottom: s(4, 1),
        },
        headerTitle: {
            textAlign: 'center',
            fontSize: s(12, 9),
            color: C.emerald700,
            marginBottom: s(10, 3),
        },
        contactRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: s(8, 4),
        },
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: s(4, 2),
            backgroundColor: C.white,
            paddingHorizontal: s(8, 4),
            paddingVertical: s(3, 1),
            borderRadius: 10,
        },
        contactLink: {
            fontSize: s(9, 7),
            color: C.gray600,
            textDecoration: 'none',
        },
        body: { flexDirection: 'column', padding: s(20, 10) },
        section: { marginBottom: s(14, 5) },
        sectionHeader: {
            fontSize: s(10, 8),
            fontFamily: 'Merriweather',
            fontWeight: 700,
            color: C.emerald700,
            borderBottomWidth: 1.5,
            borderBottomColor: C.emerald200,
            paddingBottom: s(3, 1),
            marginBottom: s(8, 3),
        },
        expBlock: {
            marginBottom: s(10, 4),
            borderLeftWidth: 2,
            borderLeftColor: C.emerald200,
            paddingLeft: s(10, 6),
        },
        expPosition: { fontFamily: 'Lato', fontWeight: 700, fontSize: s(10, 8), color: C.gray800 },
        expMeta: { fontSize: s(9, 7), color: C.gray600, marginBottom: s(3, 1) },
        expCompany: { fontSize: s(9, 7), color: C.emerald700 },
        bulletRow: { flexDirection: 'row', marginBottom: s(2, 0.5) },
        bulletDot: { width: 10, fontSize: s(9, 7), color: C.emerald600 },
        bulletText: { flex: 1, fontSize: s(9, 7), color: C.gray700, lineHeight: s(1.4, 1.2) },
        eduBlock: { marginBottom: s(8, 3) },
        eduDegree: { fontFamily: 'Lato', fontWeight: 700, fontSize: s(10, 8), color: C.gray800 },
        eduInstitution: { fontSize: s(9, 7), color: C.emerald700 },
        eduYears: { fontSize: s(9, 7), color: C.gray500 },
        card: {
            borderRadius: 6,
            padding: s(10, 5),
            marginBottom: s(12, 5),
        },
        cardEmerald: { backgroundColor: C.emerald50 },
        cardTeal: { backgroundColor: C.teal50 },
        cardDeep: { backgroundColor: C.emerald100 },
        cardHeader: {
            fontSize: s(9, 7),
            fontFamily: 'Merriweather',
            fontWeight: 700,
            color: C.emerald700,
            borderBottomWidth: 1,
            borderBottomColor: C.emerald200,
            paddingBottom: s(3, 1),
            marginBottom: s(6, 2),
        },
        cardHeaderTeal: { color: C.teal600, borderBottomColor: C.emerald200 },
        cardHeaderDeep: { color: C.emerald800, borderBottomColor: C.emerald200 },
        skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(3, 2) },
        skillTag: {
            backgroundColor: C.emerald100,
            color: C.emerald700,
            borderRadius: 3,
            paddingHorizontal: s(5, 3),
            paddingVertical: s(2, 1),
            fontSize: s(8, 6),
        },
        langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(3, 1) },
        langName: { fontFamily: 'Lato', fontWeight: 700, fontSize: s(9, 7) },
        langLevel: { fontSize: s(9, 7), color: C.teal600 },
        interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(3, 2) },
        interestTag: {
            backgroundColor: C.emerald200,
            color: C.emerald800,
            borderRadius: 3,
            paddingHorizontal: s(5, 3),
            paddingVertical: s(2, 1),
            fontSize: s(8, 6),
        },
        gdpr: {
            fontSize: s(7, 6),
            color: '#9CA3AF',
            marginTop: s(12, 4),
            borderTopWidth: 0.5,
            borderTopColor: C.gray200,
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

export function VeterinaryPDF({ data, compactScale = 0, lang = 'en' }: VeterinaryPDFProps) {
    const styles = createStyles(compactScale);
    const iconSize = lerp(9, 7, compactScale);
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
            creator={buildResumeMetadata('veterinary', data)}
            language={lang}
        >
            <Page size='A4' style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerName}>
                        {p.firstName} {p.lastName}
                    </Text>
                    {p.title ? <Text style={styles.headerTitle}>{p.title}</Text> : null}
                    <View style={styles.contactRow}>
                        {p.location ? (
                            <View style={styles.contactItem}>
                                <MapPinIcon size={iconSize} color={C.gray600} />
                                <Text style={styles.contactLink}>{p.location}</Text>
                            </View>
                        ) : null}
                        {p.email ? (
                            <View style={styles.contactItem}>
                                <MailIcon size={iconSize} color={C.gray600} />
                                <Link src={`mailto:${p.email}`} style={styles.contactLink}>
                                    {p.email}
                                </Link>
                            </View>
                        ) : null}
                        {p.phone ? (
                            <View style={styles.contactItem}>
                                <PhoneIcon size={iconSize} color={C.gray600} />
                                <Link src={`tel:${p.phone}`} style={styles.contactLink}>
                                    {p.phone}
                                </Link>
                            </View>
                        ) : null}
                        {p.linkedin ? (
                            <View style={styles.contactItem}>
                                <LinkedinIcon size={iconSize} color={C.gray600} />
                                <Link src={p.linkedin} style={styles.contactLink}>
                                    {formatLinkedinDisplay(p.linkedin)}
                                </Link>
                            </View>
                        ) : null}
                        {p.website ? (
                            <View style={styles.contactItem}>
                                <GlobeIcon size={iconSize} color={C.gray600} />
                                <Link src={p.website} style={styles.contactLink}>
                                    {p.website}
                                </Link>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View style={styles.body}>
                    {experiences.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>{str.workExperience}</Text>
                            {experiences.map((exp, i) => (
                                <View key={i} style={styles.expBlock} wrap={false}>
                                    <Text style={styles.expPosition}>{exp.position}</Text>
                                    <Text style={styles.expCompany}>{exp.company}</Text>
                                    <Text style={styles.expMeta}>
                                        {formatCVDateShort(exp.startDate, lang)} -{' '}
                                        {exp.current
                                            ? str.present
                                            : formatCVDateShort(exp.endDate, lang)}
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
                            <Text style={styles.sectionHeader}>{str.education}</Text>
                            {education.map((edu, i) => (
                                <View key={i} style={styles.eduBlock} wrap={false}>
                                    <Text style={styles.eduDegree}>
                                        {edu.degree}
                                        {edu.degree && edu.field ? ' in ' : ''}
                                        {edu.field}
                                    </Text>
                                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                                    <Text style={styles.eduYears}>
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
                        <View style={[styles.card, styles.cardEmerald]} wrap={false}>
                            <Text style={styles.cardHeader}>{str.skills}</Text>
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
                        <View style={[styles.card, styles.cardTeal]} wrap={false}>
                            <Text style={[styles.cardHeader, styles.cardHeaderTeal]}>
                                {str.languages}
                            </Text>
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
                        <View style={[styles.card, styles.cardDeep]} wrap={false}>
                            <Text style={[styles.cardHeader, styles.cardHeaderDeep]}>
                                {str.specialInterests.toUpperCase()}
                            </Text>
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
