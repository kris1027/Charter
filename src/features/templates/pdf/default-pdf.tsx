import '@/features/templates/pdf/pdf-fonts';
import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/features/resume/form-types';
import { formatLinkedinDisplay } from '@/lib/utils';
import { formatCVDateShort, formatCVYear } from '@/lib/date-format';
import type { AppLang } from '@/lib/app-lang';
import { getPDFStrings } from '@/features/templates/pdf/pdf-translations';
import { buildResumeMetadata } from '@/features/resume/resume-metadata';
import {
    GlobeIcon,
    LinkedinIcon,
    MapPinIcon,
    MailIcon,
    PhoneIcon,
} from '@/features/templates/pdf/pdf-icons';

interface DefaultPDFProps {
    data: ResumeData;
    compactScale?: number; // 0 = normal, 1 = maximum compact
    lang?: AppLang;
}

const C = {
    white: '#FFFFFF',
    slateBlue: '#1E40AF',
    gray900: '#111827',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray500: '#6B7280',
    gray200: '#E5E7EB',
    gray100: '#F3F4F6',
    gray50: '#F9FAFB',
} as const;

const lerp = (normal: number, min: number, t: number) =>
    Math.round((normal + (min - normal) * t) * 10) / 10;

function createStyles(t: number) {
    const s = (n: number, m: number) => lerp(n, m, t);
    return StyleSheet.create({
        page: {
            fontFamily: 'Montserrat',
            backgroundColor: C.white,
            fontSize: 10,
            color: C.gray800,
            paddingTop: s(20, 8),
        },
        headerBlock: {
            backgroundColor: C.gray50,
            paddingHorizontal: s(32, 18),
            paddingTop: s(4, 1),
            paddingBottom: s(16, 6),
            borderBottomWidth: 1,
            borderBottomColor: C.gray200,
            marginBottom: s(8, 2),
        },
        headerFirstName: { fontSize: s(22, 15), letterSpacing: 2, color: C.gray800 },
        headerLastName: {
            fontSize: s(22, 15),
            fontFamily: 'Montserrat',
            fontWeight: 700,
            letterSpacing: 2,
            color: C.gray800,
        },
        headerNameRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: s(4, 1) },
        headerTitle: {
            textAlign: 'center',
            fontSize: s(11, 8),
            color: C.gray500,
            marginBottom: s(8, 2),
        },
        contactRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: s(16, 8),
        },
        contactItem: { flexDirection: 'row', alignItems: 'center', gap: s(4, 2) },
        contactLink: { fontSize: s(9, 7), color: C.gray500, textDecoration: 'none' },
        body: { paddingHorizontal: s(32, 18), paddingBottom: s(24, 10) },
        section: { marginBottom: s(14, 5) },
        sectionHeader: {
            fontSize: s(9, 7),
            fontFamily: 'Montserrat',
            fontWeight: 700,
            letterSpacing: 1.5,
            color: C.slateBlue,
            borderBottomWidth: 1.5,
            borderBottomColor: C.slateBlue,
            paddingBottom: s(3, 1),
            marginBottom: s(8, 3),
        },
        expBlock: { marginBottom: s(10, 4) },
        expTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(2, 1) },
        expPosition: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: s(10, 8) },
        expDate: { fontSize: s(9, 7), color: C.gray500 },
        expCompanyRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: s(3, 1),
        },
        expCompany: {
            fontFamily: 'Montserrat',
            fontWeight: 700,
            color: C.gray700,
            fontSize: s(9, 7),
        },
        expLocation: { fontSize: s(8, 6), color: C.gray500 },
        bulletRow: { flexDirection: 'row', marginBottom: s(1.5, 0.5) },
        bulletDot: { width: 10, fontSize: s(9, 7) },
        bulletText: { flex: 1, fontSize: s(9, 7), color: C.gray700, lineHeight: s(1.4, 1.2) },
        eduBlock: { marginBottom: s(8, 3) },
        eduTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
        eduDegree: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: s(10, 8) },
        eduYears: { fontSize: s(9, 7), color: C.gray500 },
        eduInstitution: { fontSize: s(9, 7), color: C.gray700 },
        skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(4, 2) },
        skillTag: {
            borderWidth: 1,
            borderColor: C.gray200,
            backgroundColor: C.gray100,
            borderRadius: 10,
            paddingHorizontal: s(8, 4),
            paddingVertical: s(2, 1),
            fontSize: s(8, 6),
            color: C.gray700,
        },
        langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(3, 1) },
        langName: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: s(9, 7) },
        langLevel: { fontSize: s(9, 7), color: C.gray500 },
        interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(4, 2) },
        interestTag: {
            borderWidth: 1,
            borderColor: C.gray200,
            backgroundColor: C.gray100,
            borderRadius: 10,
            paddingHorizontal: s(8, 4),
            paddingVertical: s(2, 1),
            fontSize: s(8, 6),
            color: C.gray700,
        },
        gdpr: {
            fontSize: s(7, 6),
            color: '#9CA3AF',
            marginTop: s(12, 4),
            borderTopWidth: 0.5,
            borderTopColor: C.gray200,
            paddingTop: s(6, 3),
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

export function DefaultPDF({ data, compactScale = 0, lang = 'en' }: DefaultPDFProps) {
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
            creator={buildResumeMetadata('default', data)}
            language={lang}
        >
            <Page size='A4' style={styles.page}>
                <View style={styles.headerBlock}>
                    <View style={styles.headerNameRow}>
                        <Text style={styles.headerFirstName}>{p.firstName} </Text>
                        <Text style={styles.headerLastName}>{p.lastName}</Text>
                    </View>
                    {p.title ? <Text style={styles.headerTitle}>{p.title}</Text> : null}

                    <View style={styles.contactRow}>
                        {p.location ? (
                            <View style={styles.contactItem}>
                                <MapPinIcon size={iconSize} color={C.gray500} />
                                <Text style={styles.contactLink}>{p.location}</Text>
                            </View>
                        ) : null}
                        {p.email ? (
                            <View style={styles.contactItem}>
                                <MailIcon size={iconSize} color={C.gray500} />
                                <Link src={`mailto:${p.email}`} style={styles.contactLink}>
                                    {p.email}
                                </Link>
                            </View>
                        ) : null}
                        {p.phone ? (
                            <View style={styles.contactItem}>
                                <PhoneIcon size={iconSize} color={C.gray500} />
                                <Link src={`tel:${p.phone}`} style={styles.contactLink}>
                                    {p.phone}
                                </Link>
                            </View>
                        ) : null}
                        {p.linkedin ? (
                            <View style={styles.contactItem}>
                                <LinkedinIcon size={iconSize} color={C.gray500} />
                                <Link src={p.linkedin} style={styles.contactLink}>
                                    {formatLinkedinDisplay(p.linkedin)}
                                </Link>
                            </View>
                        ) : null}
                        {p.website ? (
                            <View style={styles.contactItem}>
                                <GlobeIcon size={iconSize} color={C.gray500} />
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
                            <Text style={styles.sectionHeader}>
                                {str.professionalExperience.toUpperCase()}
                            </Text>
                            {experiences.map((exp, i) => (
                                <View key={i} style={styles.expBlock} wrap={false}>
                                    <View style={styles.expTopRow}>
                                        <Text style={styles.expPosition}>{exp.position}</Text>
                                        <Text style={styles.expDate}>
                                            {formatCVDateShort(exp.startDate, lang)} -{' '}
                                            {exp.current
                                                ? str.present
                                                : formatCVDateShort(exp.endDate, lang)}
                                        </Text>
                                    </View>
                                    <View style={styles.expCompanyRow}>
                                        <Text style={styles.expCompany}>{exp.company}</Text>
                                        {exp.location ? (
                                            <Text style={styles.expLocation}>{exp.location}</Text>
                                        ) : null}
                                    </View>
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
                            <Text style={styles.sectionHeader}>{str.education.toUpperCase()}</Text>
                            {education.map((edu, i) => (
                                <View key={i} style={styles.eduBlock} wrap={false}>
                                    <View style={styles.eduTopRow}>
                                        <Text style={styles.eduDegree}>
                                            {edu.degree}
                                            {edu.degree && edu.field ? ' in ' : ''}
                                            {edu.field}
                                        </Text>
                                        <Text style={styles.eduYears}>
                                            {formatCVYear(edu.startDate)} -{' '}
                                            {formatCVYear(edu.endDate)}
                                        </Text>
                                    </View>
                                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                                    {edu.description ? (
                                        <Text style={styles.bulletText}>{edu.description}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {skills.length > 0 && (
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.sectionHeader}>
                                {str.coreCompetencies.toUpperCase()}
                            </Text>
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
                            <Text style={styles.sectionHeader}>{str.languages.toUpperCase()}</Text>
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
                            <Text style={styles.sectionHeader}>{str.interests.toUpperCase()}</Text>
                            <View style={styles.interestsWrap}>
                                {interests.map((interest, i) => (
                                    <Text key={i} style={styles.interestTag}>
                                        {interest.name}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    )}

                    {gdprConsent?.enabled ? <Text style={styles.gdpr}>{gdprText}</Text> : null}
                </View>
            </Page>
        </Document>
    );
}
