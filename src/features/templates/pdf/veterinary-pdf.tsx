import '@/features/templates/pdf/pdf-fonts';
import { Fragment } from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import { buildResumeView } from '@/features/templates/model/resume-view';
import { TEMPLATE_LAYOUTS } from '@/features/templates/model/template-layouts';
import { ContactRows } from '@/features/templates/pdf/contact-rows';
import { lerp } from '@/features/templates/pdf/pdf-scale';
import { ResumeDocument } from '@/features/templates/pdf/resume-document';
import { renderSection } from '@/features/templates/pdf/section-renderers';
import type { RenderCtx, SectionRenderers } from '@/features/templates/pdf/section-renderers';

type VeterinaryPDFProps = {
    data: ResumeData;
    compactScale?: number; // 0 = normal, 1 = maximum compact
    lang?: AppLang;
};

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

type Styles = ReturnType<typeof createStyles>;

const renderers = {
    experience: (section, { styles }) => (
        <View style={styles.section}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.items.map((exp, i) => (
                <View key={i} style={styles.expBlock} wrap={false}>
                    <Text style={styles.expPosition}>{exp.position}</Text>
                    <Text style={styles.expCompany}>{exp.company}</Text>
                    {/* Keep the text runs split as before the model: other splits shift glyphs */}
                    <Text style={styles.expMeta}>
                        {exp.start}
                        {' -'} {exp.end}
                        {exp.location ? ` | ${exp.location}` : ''}
                    </Text>
                    {exp.bullets.map((line, j) => (
                        <View key={j} style={styles.bulletRow}>
                            <Text style={styles.bulletDot}>{'• '}</Text>
                            <Text style={styles.bulletText}>{line}</Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    ),
    education: (section, { styles }) => (
        <View style={styles.section} wrap={false}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.items.map((edu, i) => (
                <View key={i} style={styles.eduBlock} wrap={false}>
                    <Text style={styles.eduDegree}>
                        {edu.degree}
                        {edu.degree && edu.field ? ' in ' : ''}
                        {edu.field}
                    </Text>
                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                    <Text style={styles.eduYears}>
                        {edu.startYear} - {edu.endYear}
                    </Text>
                    {edu.description ? (
                        <Text style={styles.bulletText}>{edu.description}</Text>
                    ) : null}
                </View>
            ))}
        </View>
    ),
    skills: (section, { styles }) => (
        <View style={[styles.card, styles.cardEmerald]} wrap={false}>
            <Text style={styles.cardHeader}>{section.title}</Text>
            <View style={styles.skillsWrap}>
                {section.items.map((skill, i) => (
                    <Text key={i} style={styles.skillTag}>
                        {skill}
                    </Text>
                ))}
            </View>
        </View>
    ),
    languages: (section, { styles }) => (
        <View style={[styles.card, styles.cardTeal]} wrap={false}>
            <Text style={[styles.cardHeader, styles.cardHeaderTeal]}>{section.title}</Text>
            {section.items.map((l, i) => (
                <View key={i} style={styles.langRow}>
                    <Text style={styles.langName}>{l.name}</Text>
                    <Text style={styles.langLevel}>{l.level}</Text>
                </View>
            ))}
        </View>
    ),
    interests: (section, { styles }) => (
        <View style={[styles.card, styles.cardDeep]} wrap={false}>
            <Text style={[styles.cardHeader, styles.cardHeaderDeep]}>{section.title}</Text>
            <View style={styles.interestsWrap}>
                {section.items.map((interest, i) => (
                    <Text key={i} style={styles.interestTag}>
                        {interest}
                    </Text>
                ))}
            </View>
        </View>
    ),
} satisfies SectionRenderers<Styles>;

export const VeterinaryPDF = ({ data, compactScale = 0, lang = 'en' }: VeterinaryPDFProps) => {
    const styles = createStyles(compactScale);
    const view = buildResumeView('veterinary', data, lang);
    const ctx: RenderCtx<Styles> = { styles };

    return (
        <ResumeDocument
            templateId='veterinary'
            data={data}
            view={view}
            lang={lang}
            pageStyle={styles.page}
        >
            <View style={styles.header}>
                <Text style={styles.headerName}>
                    {view.name.first} {view.name.last}
                </Text>
                {view.title ? <Text style={styles.headerTitle}>{view.title}</Text> : null}
                <ContactRows
                    rows={view.contactRows}
                    rowStyle={styles.contactRow}
                    itemStyle={styles.contactItem}
                    textStyle={styles.contactLink}
                    iconSize={lerp(9, 7, compactScale)}
                    iconColor={C.gray600}
                />
            </View>

            <View style={styles.body}>
                {TEMPLATE_LAYOUTS.veterinary.sections.map((id) => (
                    <Fragment key={id}>{renderSection(renderers, id, view, ctx)}</Fragment>
                ))}
            </View>

            {view.gdpr ? <Text style={styles.gdpr}>{view.gdpr}</Text> : null}
        </ResumeDocument>
    );
};
